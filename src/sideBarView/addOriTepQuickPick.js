"use strict"

Object.defineProperty(exports, "__esModule", { value: true })
const vscode = require("vscode")
const path = require("path")
const fs = require('fs')
const FileManager = require("./FileManager")
const Fuzzy_1 = require("./Fuzzy")
const TemplateService = require('./templateService')

class QuickPick {
  constructor(base) {
    this.fm = new FileManager.default(base)
    this.oldPath = null
    this.config = vscode.workspace.getConfiguration('xx')
    this.items = []
    this.quickPick = vscode.window.createQuickPick()
    this.quickPick.onDidHide(() => this.quickPick.dispose())
    this.quickPick.onDidAccept(() => {
      const selected = this.quickPick.selectedItems[0]
      // A hack for ignoring duplicate firing of the event when items
      // are changed. Need to investigate whether it's a bug in the code.
      if (!selected && this.quickPick.activeItems.length > 0) {
        return
      }

      this.accept(selected)
    })
    this.quickPick.placeholder = '请输入api名称'
    this.quickPick.onDidChangeValue((value) => {
      this.changePath(value)
    })
  }
  async changePath(input) {
    // The "gibberish" part is for getting around the fact, that `.dirname()`
    // does omit the directory seperator at the end. We don't want that.
    const newPath = path.normalize(path.dirname(this.fm.getUri(input).fsPath + '__gibberish__'))
    if (newPath !== this.oldPath) {
      await this.setItems(newPath)
    }
    this.filterItems(input)
    this.oldPath = newPath
  }
  filterItems(input) {
    const filename = path.basename(input + '__gibberish__').replace('__gibberish__', '')
    if (!filename) {
      this.quickPick.items = this.items
      return
    }
    this.quickPick.items = this.items.filter(item => {
      return Fuzzy_1.default.search(filename, item.name)
    })
  }
  sortItems() {
    this.items.sort((a, b) => {
      if (a.directory > b.directory)
        return -1
      if (a.directory < b.directory)
        return 1
      if (a.name < b.name)
        return -1
      if (a.name > b.name)
        return 1
      return 0
    })
  }
  async accept(selected) {
    // console.log(selected)
    if (selected && selected.name !== this.quickPick.value) {
      selected = undefined
    }
    if (selected === undefined) {
      const path = await this.createNew()
      if (path) {
        this.fm.openFile(path)
      }
      this.quickPick.hide()
    }
    else {
      if (selected.directory) {
        this.changePath(selected.fullPath + path.sep)
      }
      else {
        this.fm.openFile(selected.fullPath)
      }
    }
  }
  async createNew() {
    const filePath = this.quickPick.value
    const uri = this.fm.getUri(filePath)
    if (filePath === '') {
      vscode.window.showWarningMessage('输入不能为空', { modal: true })
      return ''
    }

    try {
      if (filePath.match(/^[^\/\\\.]*$/)) {
        const templatePath = path.join(__dirname, 'templateCode', 'todo')
        await this.fm.copy(templatePath, uri.fsPath)
        
        const templateService = new TemplateService.TemplateService(path.resolve(vscode.workspace.rootPath, 'template.yml'))
        const functionName = fs.readdirSync(templatePath)
        if (!await templateService.addApi(filePath, functionName)) {
          return
        }
        
        await vscode.commands.executeCommand('extension.refreshLocal')
        return path.join(filePath, 'index.js')
      } else {
        await vscode.window.showWarningMessage(`输入的${filePath}含有不合法字符，请重新输入正确的api名称`, { modal: true })
      }
    }
    catch (e) {
      console.error(e)
    }
  }
  async show() {
    // const defaultPath = this.config.get('defaultPath')
    this.quickPick.show()
    // this.changePath('/')
  }
  async setItems(pPath) {
    const directory = path.relative(this.fm.getUri().fsPath, pPath)
    const relativeToRoot = path.relative(this.fm.getUri('/').fsPath, pPath)
    let content = []
    try {
      content = await this.fm.getContent(directory)
    }
    catch (e) {
      // Isn't there some better method for checking of which type the error is?
      if (e.name !== 'EntryNotFound (FileSystemError)') {
        console.error(e)
      }
    }
    const showDetails = this.config.get('showDetails')
    this.items = content.map(item => {
      const isDir = item[1] === vscode.FileType.Directory
      const icon = isDir ? '$(file-directory)' : '$(file-code)'
      return {
        name: item[0],
        label: `${icon}  ${item[0]}`,
        fullPath: path.join(directory, item[0]),
        directory: isDir,
        alwaysShow: true,
        detail: showDetails ? path.join(relativeToRoot, item[0]) : undefined,
      }
    })
    this.sortItems()
  }
}
exports.default = QuickPick
//# sourceMappingURL=QuickPick.js.map