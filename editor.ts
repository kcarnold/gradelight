import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { gutter, GutterMarker, lineNumbers } from "@codemirror/gutter";
import {markdown} from "@codemirror/lang-markdown";
import { RangeSet } from "@codemirror/rangeset";
import { StateEffect, StateField } from "@codemirror/state";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";

// https://github.com/codemirror/website/blob/master/site/examples/gutter/gutters.ts

const emptyMarker = new class extends GutterMarker {
  toDOM() { return document.createTextNode("≠")}
}

const emptyLineGutter = gutter({
  lineMarker(view, line) {
    return line.from === line.to ? emptyMarker : null
  },
  initialSpacer: () => emptyMarker
});

const usesEffect = StateEffect.define<{pos: number, on: boolean}>({
  map: (val, mapping) => ({pos: mapping.mapPos(val.pos), on: val.on})
})

// FIXME: removing a region (by pasting over it, for example) doesn't seem to remove the markers.
const usesState = StateField.define<RangeSet<GutterMarker>>({
  create() { return RangeSet.empty },
  update(set, transaction) {
    set = set.map(transaction.changes);
    for (let e of transaction.effects) {
      if (!e.is(usesEffect)) continue;
      if (e.value.on) {
        set = set.update({add: [usesMarker.range(e.value.pos)]});
      } else {
        set = set.update({filter: from => from != e.value.pos})
      }
    }
    return set;
  }
});

function toggleUse(view: EditorView, pos: number) {
  let uses = view.state.field(usesState);
  let hasUse = false;
  uses.between(pos, pos, () => {hasUse = true});
  view.dispatch({
    effects: usesEffect.of({pos, on: !hasUse})
  });
}

const usesMarker = new class extends GutterMarker {
  toDOM() { return document.createTextNode(">")}
}

const usesGutter = [
  usesState,
  gutter({
    class: "cm-uses-gutter",
    markers: v => v.state.field(usesState),
    initialSpacer: () => usesMarker,
    domEventHandlers: {
      mousedown(view, line) {
        toggleUse(view, line.from);
        return true;
      }
    }
  }),
  EditorView.baseTheme({
    ".cm-uses-gutter .cm-gutterElement": {
      color: "red",
      paddingLeft: "5px",
      cursor: "default"
    }
  })
]

const combinedView = ViewPlugin.fromClass(class {
  constructor(view) {
  }

  update(update: ViewUpdate) {
    //console.log(update.state.doc.length);
    let uses = update.state.field(usesState);
    console.log(uses.size);
    let cursor = uses.iter();
    let texts = [];
    while (!!cursor.value) {
      let line = update.state.doc.lineAt(cursor.from);
      texts.push(line.text);
      cursor.next();
    }
    let joined = texts.join('\n');
    console.log(joined);
    const textArea = document.getElementById("combined");
    textArea.textContent = joined;
  }

  destroy() {}
})

let editor = new EditorView({
  state: EditorState.create({
    doc: "- Feedback 1\n- `Feedback 2`\n- *Feedback 3*",
    extensions: [usesGutter, basicSetup, markdown(), emptyLineGutter,
      combinedView]
  }),
  parent: document.querySelector("#editor")
});
