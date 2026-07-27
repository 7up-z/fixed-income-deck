import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const SLIDE_COUNT = 22;
const WIDTH = 1672;
const HEIGHT = 941;
const BASE_URL = import.meta.env.BASE_URL;
const BLUEPRINT_ROOT = import.meta.env.VITE_BLUEPRINT_ROOT || "blueprints";
const BLUEPRINT_EXT = import.meta.env.VITE_BLUEPRINT_EXT || "png";

function slideId(value) {
  const number = Math.max(1, Math.min(SLIDE_COUNT, Number(value) || 1));
  return String(number).padStart(2, "0");
}

function blueprintUrl(id) {
  return `${BASE_URL}${BLUEPRINT_ROOT}/slide-${id}.${BLUEPRINT_EXT}`;
}

function pageUrl(path = "") {
  return `${BASE_URL}${path.replace(/^\/+/, "")}`;
}

function storageKey(id) {
  return `fixed-income-deck:${id}`;
}

function useDeckData() {
  const [data, setData] = useState({ slides: [] });
  useEffect(() => {
    fetch(`${BASE_URL}data/slides.json`)
      .then((response) => response.json())
      .then(setData);
  }, []);
  return data;
}

function useScale(extraHeight = 0, extraWidth = 0) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const availableWidth = Math.max(320, window.innerWidth - extraWidth);
      const availableHeight = Math.max(200, window.innerHeight - extraHeight);
      setScale(Math.min(availableWidth / WIDTH, availableHeight / HEIGHT));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [extraHeight]);
  return scale;
}

function loadEdits(id) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(id)) || "{}");
  } catch {
    return {};
  }
}

function SlidePatches({ patches = [] }) {
  return patches.map((patch, index) => {
    if (patch.kind === "erase") {
      return patch.segments.map((segment, segmentIndex) => (
        <span
          key={`${index}-${segmentIndex}`}
          className="slide-patch erase-line"
          style={{
            left: segment.x,
            top: patch.y,
            width: segment.w,
            height: patch.h,
          }}
        />
      ));
    }
    if (patch.kind === "replace-text") {
      return (
        <span
          key={index}
          className="slide-patch replace-text"
          style={{
            left: patch.x,
            top: patch.y,
            width: patch.w,
            height: patch.h,
          }}
        >
          {patch.text}
        </span>
      );
    }
    return null;
  });
}

function SlideCanvas({ id, textBoxes = [], patches = [], edits = {}, editable = false, onEdit }) {
  const stackedEditor = editable && window.matchMedia("(max-width: 980px)").matches;
  const scale = useScale(editable ? 128 : 0, editable && !stackedEditor ? 394 : 0);
  const overrides = edits.texts || {};
  return (
    <div
      className={`canvas-stage ${editable ? "is-editing" : ""}`}
      style={{ width: WIDTH * scale, height: HEIGHT * scale }}
    >
      <section
        className="slide-canvas"
        data-testid="slide-canvas"
        style={{ transform: `scale(${scale})` }}
        aria-label={`第${Number(id)}页`}
      >
        <img className="blueprint" src={blueprintUrl(id)} alt="" draggable="false" />
        <SlidePatches patches={patches} />
        {textBoxes.map((box) => {
          const changed = Object.prototype.hasOwnProperty.call(overrides, box.key);
          if (!editable && !changed) return null;
          return (
            <div
              key={box.key}
              className={`text-hotspot ${changed ? "has-override" : ""}`}
              style={{
                left: box.x,
                top: box.y,
                width: box.w,
                height: box.h,
                fontSize: box.fontSize,
                textAlign: box.align,
              }}
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(event) => onEdit?.(box.key, event.currentTarget.innerText)}
              title={editable ? "点击修改此文本" : undefined}
            >
              {changed ? overrides[box.key] : box.text}
            </div>
          );
        })}
      </section>
    </div>
  );
}

function SlideView({ id, data }) {
  const slide = data.slides.find((item) => item.id === id);
  const [edits, setEdits] = useState({});
  useEffect(() => setEdits(loadEdits(id)), [id]);
  return (
    <main className="viewer">
      <SlideCanvas id={id} textBoxes={slide?.textBoxes} patches={slide?.patches} edits={edits} />
    </main>
  );
}

function Editor({ id, data }) {
  const slide = data.slides.find((item) => item.id === id);
  const [draft, setDraft] = useState(() => loadEdits(id));
  const [saved, setSaved] = useState(false);
  const original = useRef(loadEdits(id));

  useEffect(() => {
    const next = loadEdits(id);
    setDraft(next);
    original.current = next;
  }, [id]);

  const updateText = (key, value) => {
    setSaved(false);
    setDraft((current) => ({
      ...current,
      texts: { ...(current.texts || {}), [key]: value },
    }));
  };

  const save = () => {
    localStorage.setItem(storageKey(id), JSON.stringify(draft));
    original.current = draft;
    setSaved(true);
  };

  const undo = () => {
    setDraft(original.current);
    setSaved(false);
  };

  const reset = () => {
    localStorage.removeItem(storageKey(id));
    original.current = {};
    setDraft({});
    setSaved(false);
  };

  return (
    <main className="editor">
      <header className="editor-bar">
        <div>
          <strong>第 {Number(id)} 页编辑</strong>
          <span>点击画布中的文字，或在右侧字段列表中修改</span>
        </div>
        <nav>
          <a href={pageUrl(`slides/${id}/`)} target="_blank" rel="noreferrer">预览纯净页面</a>
          <button type="button" onClick={undo}>撤销未保存修改</button>
          <button type="button" onClick={reset}>恢复蓝图初始值</button>
          <button type="button" className="primary" onClick={save}>保存</button>
          {saved && <em>已保存</em>}
        </nav>
      </header>
      <div className="editor-workspace">
        <SlideCanvas
          id={id}
          textBoxes={slide?.textBoxes}
          patches={slide?.patches}
          edits={draft}
          editable
          onEdit={updateText}
        />
        <aside className="field-panel">
          <h2>可编辑文字</h2>
          <p>保存后，修改内容会覆盖显示在纯净页面中。</p>
          {(slide?.textBoxes || []).map((box) => (
            <label key={box.key}>
              <span>{box.label}</span>
              <textarea
                value={draft.texts?.[box.key] ?? box.text}
                onChange={(event) => updateText(box.key, event.target.value)}
              />
            </label>
          ))}
        </aside>
      </div>
    </main>
  );
}

function Overview() {
  const ids = useMemo(
    () => Array.from({ length: SLIDE_COUNT }, (_, index) => slideId(index + 1)),
    []
  );
  return (
    <main className="overview">
      <header>
        <p>NEW TOWN · 另类投资部</p>
        <h1>固收业务展业研究汇报</h1>
        <span>22 页网页复刻 · 固定画布 1672×941</span>
      </header>
      <section className="slide-grid">
        {ids.map((id) => (
          <article key={id}>
            <a href={pageUrl(`slides/${id}/`)} className="thumb">
              <img src={blueprintUrl(id)} alt={`第${Number(id)}页缩略图`} />
            </a>
            <footer>
              <strong>{id}</strong>
              <a href={pageUrl(`slides/${id}/`)}>查看</a>
              <a href={pageUrl(`edit/${id}/`)}>编辑</a>
            </footer>
          </article>
        ))}
      </section>
    </main>
  );
}

export function App() {
  const data = useDeckData();
  const basePath = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const path = window.location.pathname.startsWith(basePath)
    ? window.location.pathname.slice(basePath.length) || "/"
    : window.location.pathname;
  const match = path.match(/^\/(slides|edit)\/(\d{1,2})\/?$/);
  if (!match) return <Overview />;
  const id = slideId(match[2]);
  return match[1] === "edit"
    ? <Editor id={id} data={data} />
    : <SlideView id={id} data={data} />;
}
