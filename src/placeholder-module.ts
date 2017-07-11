import {Quill} from 'quill'
import {default as ParchmentTypes} from 'parchment'

import PlaceholderBlot from './placeholder-blot'
import {Placeholder} from './placeholder'
import {ModuleOptions} from './module-options'

const Parchment: typeof ParchmentTypes = Quill.import('parchment')
Quill.register(PlaceholderBlot)

export class PlaceholderModule {
  private placeholders: Array<Placeholder>

  constructor(private quill: Quill.Quill, options: ModuleOptions) {
    this.placeholders = options.placeholders
    PlaceholderBlot.className = options.className || 'ql-placeholder-content'
    PlaceholderBlot.delimiters = options.delimiters || ['{', '}']

    this.quill.getModule('toolbar').addHandler('placeholder', this.toolbarHandler)
    this.quill.root.addEventListener('click', <EventListener>this.onClick)
    this.quill.on('text-change', this.onTextChange)
  }

  onTextChange = (_: any, oldDelta: Quill.DeltaStatic, source: Quill.Sources) => {
    if (source === Quill.sources.USER) {
      const currrentContents = this.quill.getContents()
      const delta = currrentContents.diff(oldDelta)

      const shouldRevert = delta.ops.filter(op => op.insert &&
        op.insert.placeholder && op.insert.placeholder.required).length

      if (shouldRevert) {
        this.quill.updateContents(delta, Quill.sources.SILENT)
      }
    }
  }

  onClick = (ev: Quill.EditorEvent) => {
    const blot = Parchment.find(ev.target.parentNode)

    if (blot instanceof PlaceholderBlot) {
      const index = this.quill.getIndex(blot)
      this.quill.setSelection(index, blot.length(), Quill.sources.USER)
    }
  }

  toolbarHandler = (identifier: string) => {
    const selection = this.quill.getSelection()
    const placeholder = this.placeholders.find((pl: Placeholder) => pl.id === identifier)
    if (!placeholder) throw new Error(`Missing placeholder for ${identifier}`)

    this.quill.deleteText(selection.index, selection.length)
    this.quill.insertEmbed(selection.index, 'placeholder', placeholder, Quill.sources.USER)
    this.quill.setSelection(selection.index + 1, 0)
  }
}