import { EditorState, EditorView, basicSetup } from "@codemirror/basic-setup";
import { gutter, GutterMarker, lineNumbers } from "@codemirror/gutter";
import {markdown} from "@codemirror/lang-markdown";
import { RangeSet } from "@codemirror/rangeset";
import { StateEffect, StateField } from "@codemirror/state";

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

let editor = new EditorView({
  state: EditorState.create({
    extensions: [usesGutter, basicSetup, markdown(), emptyLineGutter]
  }),
  parent: document.querySelector("#editor")
});
