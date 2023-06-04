import HighlightJsRenderer from 'typora-parser/build/src/plugins/HighlightJsRenderer';
import MathJaxRenderer from 'typora-parser/build/src/plugins/MathJaxRenderer';
import TyporaParser, { RenderOptions } from 'typora-parser';
import * as fs from "fs";
import path from 'path';
import { Notice } from 'obsidian';

export default class Renderer {
  private static async saveFile(context: any, title: string, data: any, filters: Array<{ name: string, extensions: Array<string> }>, defaultPath?: string) {
    const remote = context.electron.remote;
    let pathObj = await remote.dialog.showSaveDialog({ title, filters, defaultPath });
    if (pathObj.canceled) return;
    fs.writeFile(pathObj.filePath, data, error => {
      if (error) return new Notice(error.message);
      return new Notice("File saved");
    });
  }


  public static async renderRawHTML(context: any, filepath: string) {
    const html = await this._renderHTML(filepath, {
      vanillaHTML: true,
      title: path.basename(filepath, ".md")
    });
    this.saveFile(context, "Save to HTML (without style)", html, [{
      name: "HTML", extensions: ["html", "htm"]
    }], path.dirname(filepath));
  }

  public static async renderHTML(context: any, filepath: string) {
    const settings = context.app.plugins.plugins["obsidian-typoradify"].settings;
    const html = await this._renderHTML(filepath, {
      extraHeadTags: `<style>${fs.readFileSync(path.resolve(`${context.app.vault.adapter.getBasePath()}/${context.app.vault.configDir}/plugins/obsidian-typoradify/default.css`), { encoding: 'utf8' })}\n${settings.theme ? fs.readFileSync(settings.theme, { encoding: 'utf8' }) : ""}\n${settings.customCss}</style>`,
      includeHead: true,
      vanillaHTML: false,
      codeRenderer: new HighlightJsRenderer({
        displayLineNumbers: settings.displayLineNumbers,
      }),
      title: path.basename(filepath, ".md"),
      latexRenderer: new MathJaxRenderer({
        autoNumbering: settings.autoNumbering,
        applyLineBreaks: settings.applyLineBreaks,
      }),
    });
    this.saveFile(context, "Save to HTML", html, [{
      name: "HTML", extensions: ["html", "htm"]
    }], path.dirname(filepath));
  }


  private static async _renderHTML(filepath: string, options?: Partial<RenderOptions> | undefined) {
    let markdown = fs.readFileSync(filepath, { encoding: 'utf8' });
    markdown = `# ${path.basename(filepath, ".md")}\n\n${markdown}`;
    const matches = markdown.matchAll(new RegExp(/!\[(.*?)\]\((.*?)\)/gim));
    for (const match of matches) {
      if ((new RegExp(/[a-zA-Z\-_0-9]+:\/\/.*?/gim)).test(match[2])) {
        continue;
      }
      const fullPath = path.join(path.dirname(filepath), match[2]);
      markdown = markdown.replace(match[0], `![${match[1]}](${fullPath})`);
    }
    return TyporaParser.parse(markdown).renderHTML(options);
  }

  public static async renderPDF(context: any, filepath: string) {
    const BrowserWindow = context.electron.remote.BrowserWindow;
    const settings = context.app.plugins.plugins["obsidian-typoradify"].settings;
    const html = await this._renderHTML(filepath, {
      extraHeadTags: `<style>${fs.readFileSync(path.resolve(`${context.app.vault.adapter.getBasePath()}/${context.app.vault.configDir}/plugins/obsidian-typoradify/default.css`), { encoding: 'utf8' })}\n${settings.theme ? fs.readFileSync(settings.theme, { encoding: 'utf8' }) : ""}\n${settings.customCss}</style>`,
      includeHead: true,
      vanillaHTML: false,
      codeRenderer: new HighlightJsRenderer({
        displayLineNumbers: settings.displayLineNumbers,
      }),
      title: path.basename(filepath, ".md"),
      latexRenderer: new MathJaxRenderer({
        autoNumbering: settings.autoNumbering,
        applyLineBreaks: settings.applyLineBreaks,
      }),
    });
    const blob = new Blob([html], { type: 'text/html; charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const window = new BrowserWindow({
      show: false, webPreferences: {
        webSecurity: false //NOTE: for access of images in the local via `file://`
      }
    })
    window.loadURL(url);
    window.webContents.on("did-finish-load", async () => {
      let data = await window.webContents.printToPDF({
        landscape: settings.landscape,
        marginsType: settings.marginsType,
        printBackground: settings.printBackground,
        printSelectionOnly: false,
        pageSize: settings.pageSize,
      });
      this.saveFile(context, "Save to PDF", data, [{
        name: "pdf", extensions: ["pdf"]
      }], path.dirname(filepath));

      window.close();
      window.destroy();
    });
  }
}