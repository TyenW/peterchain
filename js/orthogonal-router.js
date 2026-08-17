/**
 * DER Builder — Roteador Ortogonal Estilo Logisim / EDA com Algoritmo A* em Grade de Custos
 * 
 * Funcionalidades:
 * 1. Matriz de custos por célula de grade (Grid Size: 20px)
 * 2. Bloqueio total das caixas de elementos (Entidades, Atributos, Relacionamentos) com margem de segurança
 * 3. Penalidade pesada para fios paralelos (evita sobreposição no mesmo trilho)
 * 4. Permissão para cruzamentos perpendiculares limpos
 * 5. Penalidade de curva (prefere retas longas a zigue-zagues denteados)
 * 6. Purificação de pontos ortogonais
 */
class OrthogonalRouter {
  constructor(model, gridSize = 20) {
    this.model = model;
    this.gridSize = gridSize;
  }

  // --- ARREDONDAR PARA COORDENADA DA GRADE ---
  snap(val) {
    return Math.round(val / this.gridSize) * this.gridSize;
  }

  // --- ALGORITMO A* PARA ROTEAMENTO DE UM FIO ENTIDADE/RELACIONAMENTO ---
  findPath(startPt, endPt, currentConnId = null) {
    const sx = this.snap(startPt.x);
    const sy = this.snap(startPt.y);
    const ex = this.snap(endPt.x);
    const ey = this.snap(endPt.y);

    if (sx === ex && sy === ey) return [startPt, endPt];

    // Mapeamento de obstáculo para verificação rápida
    const obstacles = this.buildObstacleBoxes(currentConnId);
    const wireOccupancy = this.buildWireOccupancyMap(currentConnId);

    // Chave de nó no grid: "x,y"
    const getKey = (x, y) => `${x},${y}`;

    // F-Score, G-Score, CameFrom
    const openSet = new Set();
    const openList = []; // Min-heap simplificado / array ordenado
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();
    const nodeDirection = new Map(); // 'H' (horizontal) ou 'V' (vertical)

    const startKey = getKey(sx, sy);
    openSet.add(startKey);
    gScore.set(startKey, 0);

    const hStart = Math.abs(sx - ex) + Math.abs(sy - ey);
    fScore.set(startKey, hStart);
    openList.push({ key: startKey, x: sx, y: sy, f: hStart });

    const maxIterations = 2500;
    let iterCount = 0;

    while (openList.length > 0 && iterCount < maxIterations) {
      iterCount++;

      // Pegar nó de menor fScore
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift();
      openSet.delete(current.key);

      const cx = current.x;
      const cy = current.y;

      // Se chegamos no destino (ou na vizinhança imediata do destino)
      if (Math.abs(cx - ex) <= this.gridSize / 2 && Math.abs(cy - ey) <= this.gridSize / 2) {
        return this.reconstructPath(cameFrom, current.key, startPt, endPt);
      }

      const currG = gScore.get(current.key) || 0;
      const currDir = nodeDirection.get(current.key) || null;

      // Vizinhos Ortogonais (Norte, Sul, Leste, Oeste em passos de gridSize)
      const neighbors = [
        { x: cx + this.gridSize, y: cy, dir: 'H' },
        { x: cx - this.gridSize, y: cy, dir: 'H' },
        { x: cx, y: cy + this.gridSize, dir: 'V' },
        { x: cx, y: cy - this.gridSize, dir: 'V' }
      ];

      for (const n of neighbors) {
        const nx = n.x;
        const ny = n.y;
        const nKey = getKey(nx, ny);

        // Bloqueio de obstáculos (caixas dos componentes)
        const isDestination = (Math.abs(nx - ex) <= 5 && Math.abs(ny - ey) <= 5);
        const isStart = (Math.abs(nx - sx) <= 5 && Math.abs(ny - sy) <= 5);

        if (!isDestination && !isStart && this.isInsideObstacle(nx, ny, obstacles)) {
          continue; // Proibido atravessar componentes
        }

        // --- SISTEMA DE CUSTOS DE TRAVESSIA LOGISIM A* ---
        let stepCost = 10; // Custo base de passo curto

        // 1. Penalidade de Curva (Evita zigue-zagues, exige retas longas)
        if (currDir && currDir !== n.dir) {
          stepCost += 35; // Penalidade por mudar de direção (dobra de 90°)
        }

        // 2. Sobreposição Paralela vs Cruzamento Perpendicular
        const cellOccupancy = wireOccupancy.get(nKey);
        if (cellOccupancy) {
          if (cellOccupancy.has(n.dir)) {
            stepCost += 180; // Penalidade altíssima para andar por cima do mesmo trilho
          } else {
            stepCost += 15; // Custo baixo para apenas cruzar perpendicularmente
          }
        }

        const tentativeG = currG + stepCost;

        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, { key: current.key, x: cx, y: cy });
          gScore.set(nKey, tentativeG);
          nodeDirection.set(nKey, n.dir);

          // Heurística de Manhattan
          const h = Math.abs(nx - ex) + Math.abs(ny - ey);
          const f = tentativeG + h;
          fScore.set(nKey, f);

          if (!openSet.has(nKey)) {
            openSet.add(nKey);
            openList.push({ key: nKey, x: nx, y: ny, f });
          }
        }
      }
    }

    // Se A* falhar ou estourar limite, fallback para Manhattan direto limpo
    return this.buildFallbackManhattan(startPt, endPt);
  }

  // --- RECONSTRUÇÃO E PURIFICAÇÃO DO CAMINHO ---
  reconstructPath(cameFrom, currentKey, startPt, endPt) {
    const rawPath = [];
    let curr = currentKey;

    while (curr && cameFrom.has(curr)) {
      const parts = curr.split(',').map(Number);
      rawPath.unshift({ x: parts[0], y: parts[1] });
      curr = cameFrom.get(curr).key;
    }
    rawPath.unshift(startPt);
    rawPath.push(endPt);

    // Purificar pontos colineares (remover pontos desnecessários na mesma reta)
    const cleanPath = [rawPath[0]];

    for (let i = 1; i < rawPath.length - 1; i++) {
      const prev = cleanPath[cleanPath.length - 1];
      const curr = rawPath[i];
      const next = rawPath[i + 1];

      // Se não estiver na mesma reta horizontal ou vertical, mantemos a curva de 90°
      const isHorizontalSame = (prev.y === curr.y && curr.y === next.y);
      const isVerticalSame = (prev.x === curr.x && curr.x === next.x);

      if (!isHorizontalSame && !isVerticalSame) {
        cleanPath.push(curr);
      }
    }

    cleanPath.push(endPt);
    return cleanPath;
  }

  // --- MAPEAR OPACO DE COMPONENTES/ELEMENTOS (OBSTÁCULOS) ---
  buildObstacleBoxes(currentConnId) {
    const boxes = [];
    const margin = 12; // Folga ao redor dos componentes

    this.model.entities.forEach(e => {
      boxes.push({
        minX: e.x - e.width / 2 - margin,
        maxX: e.x + e.width / 2 + margin,
        minY: e.y - e.height / 2 - margin,
        maxY: e.y + e.height / 2 + margin
      });
    });

    this.model.relationships.forEach(r => {
      boxes.push({
        minX: r.x - r.width / 2 - margin,
        maxX: r.x + r.width / 2 + margin,
        minY: r.y - r.height / 2 - margin,
        maxY: r.y + r.height / 2 + margin
      });
    });

    return boxes;
  }

  isInsideObstacle(x, y, boxes) {
    for (const b of boxes) {
      if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) {
        return true;
      }
    }
    return false;
  }

  // --- MAPEAR OCUPAÇÃO DE OUTROS FIOS JÁ DESENHADOS NO DIAGRAMA ---
  buildWireOccupancyMap(currentConnId) {
    const occupancy = new Map();

    this.model.connections.forEach(conn => {
      if (conn.id === currentConnId) return;

      // Se a conexão já tiver pontos ou calculamos segmento simples
      const source = this.model.getElementById(conn.sourceId);
      const target = this.model.getElementById(conn.targetId);

      if (!source || !target) return;
      if (source.type === 'attribute' || target.type === 'attribute') return;

      const p1 = { x: this.snap(source.x), y: this.snap(source.y) };
      const p2 = { x: this.snap(target.x), y: this.snap(target.y) };

      // Marcar linha reta simples para ocupação
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      for (let x = minX; x <= maxX; x += this.gridSize) {
        for (let y = minY; y <= maxY; y += this.gridSize) {
          const key = `${x},${y}`;
          if (!occupancy.has(key)) occupancy.set(key, new Set());
          const dir = (p1.y === p2.y) ? 'H' : 'V';
          occupancy.get(key).add(dir);
        }
      }
    });

    return occupancy;
  }

  // --- FALLBACK MANHATTAN CASO O GRAFO ESTEJA MUITO DENSO ---
  buildFallbackManhattan(startPt, endPt) {
    const midX = Math.round((startPt.x + endPt.x) / 2 / this.gridSize) * this.gridSize;
    return [
      startPt,
      { x: midX, y: startPt.y },
      { x: midX, y: endPt.y },
      endPt
    ];
  }
}
