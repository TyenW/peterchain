import re
import pathlib

root = pathlib.Path(r"C:\Users\Usuário\Desktop\codigos\peterchain")
html = (root / "index.html").read_text(encoding="utf-8")
js = (root / "js" / "canvas-controller.js").read_text(encoding="utf-8")
handler = (root / "js" / "interaction-handler.js").read_text(encoding="utf-8")
model = (root / "js" / "diagram-model.js").read_text(encoding="utf-8")
base = (root / "js" / "renderers" / "renderer-base.js").read_text(encoding="utf-8")
app = (root / "js" / "app.js").read_text(encoding="utf-8")

ids = re.findall(r'id="([^"]+)"', html)
print("HTML ids:")
for i in ids:
    if any(k in i.lower() for k in ["svg", "canvas", "viewport", "layer", "temp", "inspector", "hint", "toolbar"]):
        print(repr(i))

print("\ncontroller getElementById:")
for m in re.findall(r"getElementById\('([^']+)'\)", js):
    print(repr(m))

print("\ndefaults:", re.findall(r"containerId = '([^']+)', svgId = '([^']+)'", js))

print("\nclosest:")
for m in re.findall(r"closest\(([^)]+)\)", handler):
    print(m)

print("\n--- createGroup ---")
idx = base.find("createGroup")
print(base[idx:idx + 400])

print("\n--- fromJSON ---")
idx = model.find("fromJSON")
print(model[idx:idx + 900])

print("\n--- autoLayout ---")
idx = model.find("autoLayout()")
print(model[idx:idx + 500])

print("\n--- getAllElements ---")
idx = model.find("getAllElements")
print(model[idx:idx + 250])

print("\n--- handler constructor ---")
print(handler[:800])

print("\n--- app generate ---")
idx = app.find("syncJSONToModel")
print(app[idx:idx + 500])
