import { App, FileSystemAdapter, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import path from 'path';
import Renderer from 'render';

interface TyporadifySettings {
  customCss: string;
  theme: string;
  displayLineNumbers: boolean;
  applyLineBreaks: boolean;
  autoNumbering: boolean;
  landscape: boolean;
  marginsType: number;
  pageSize: string;
  printBackground: boolean;
}

const DEFAULT_SETTINGS: TyporadifySettings = {
  customCss: "",
  theme: "",
  displayLineNumbers: false,
  applyLineBreaks: false,
  autoNumbering: true,
  landscape: false,
  marginsType: 0,
  pageSize: "A4",
  printBackground: false
}

export default class Typoradify extends Plugin {
  settings: TyporadifySettings;

  async onload() {
    await this.loadSettings();
    await this.registerCommands();
    await this.registerSettingTabs();
  }

  async registerCommands() {
    this.addCommand({
      id: 'render-html',
      name: 'Render HTML',
      callback: async () => {
        new Notice(`Exporting ${path.basename(await this.getCurrentFile() as string)} to HTML`);
        await Renderer.renderHTML(global, await this.getCurrentFile() as string);
      }
    });

    this.addCommand({
      id: 'render-raw-html',
      name: 'Render HTML (without styles)',
      callback: async () => {
        new Notice(`Exporting ${path.basename(await this.getCurrentFile() as string)} to HTML (without styles)`);
        await Renderer.renderRawHTML(global, await this.getCurrentFile() as string);
      }
    });

    this.addCommand({
      id: 'render-pdf',
      name: 'Render PDF',
      callback: async () => {
        new Notice(`Exporting ${path.basename(await this.getCurrentFile() as string)} to PDF`);
        await Renderer.renderPDF(global, await this.getCurrentFile() as string);
      }
    });
  }

  async registerSettingTabs() {
    this.addSettingTab(new TyporadifySettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }


  async getCurrentFile(): Promise<string | null> {
    const fileData = this.app.workspace.getActiveFile();
    if (!fileData) return null;
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter)
      return adapter.getFullPath(fileData.path);
    return null;
  }
}

class TyporadifySettingTab extends PluginSettingTab {
  plugin: Typoradify;

  constructor(app: App, plugin: Typoradify) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('div', {
      text: "Settings for `Typoradify'", attr: {
        class: "setting-item-name"
      }
    });
    containerEl.createEl('div', {
      text: "Settings for `Typoradify' is seperated to two parts as they are supplied by different components.", attr: {
        class: "setting-item-description"
      }
    });
    containerEl.createEl('h2', { text: "Settings for Typora-parser" });

    new Setting(containerEl)
      .setName('Auto numbering the math equations')
      .setDesc('When toggled on, math equation will be automatically.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoNumbering)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change autoNumbering to ${value}`);
          this.plugin.settings.autoNumbering = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Line breaks in math equation')
      .setDesc('When toggled on, line breaks may happend in the math equation.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.applyLineBreaks)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change applyLineBreaks to ${value}`);
          this.plugin.settings.applyLineBreaks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Display line numbers in fenced codeblocks')
      .setDesc('When toggled on, line numbers will appear in each line of codes.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.displayLineNumbers)
        .onChange(async (value: boolean) => {
          console.log(`[CONFIG] Change displayLineNumbers to ${value}`);
          this.plugin.settings.displayLineNumbers = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Typora Theme CSS')
      .setDesc('The full path of a Typora Theme CSS file to render the file with.')
      .addText(text => text
        .setPlaceholder('Sample: ~/theme.css')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value: string) => {
          console.log(`[CONFIG] Change theme file to ${value}`);
          this.plugin.settings.theme = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Custom CSS')
      .setDesc('Custom CSS overwrites the CSS given above.')
      .addTextArea(textarea => textarea
        .setPlaceholder('Sample: .test{color: blue}')
        .setValue(this.plugin.settings.customCss)
        .onChange(async (value: string) => {
          console.log(`[CONFIG] Change customCss to ${value}`);
          this.plugin.settings.customCss = value;
          await this.plugin.saveSettings();
        }));


    // landscape: false,
    // marginsType: 0,
    // printBackground: false,
    // printSelectionOnly: false,
    // pageSize: "A4",


    containerEl.createEl('h2', { text: "Settings for Electron printer" });

    new Setting(containerEl)
      .setName('Paper direction')
      .setDesc('The paper direction when printing as PDF.')
      .addDropdown(dropdown => dropdown
        .addOptions({ "false": "portrait", "true": "landscape" })
        .setValue((this.plugin.settings.landscape ? "true" : "false"))
        .onChange(async (value) => {
          console.log(`[CONFIG] Change landscape to ${value}`);
          this.plugin.settings.landscape = (value === "true");
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName('Margins Type')
      .setDesc('Paper margins type when printing as PDF.')
      .addDropdown(dropdown => dropdown
        .addOptions({ 0: "default", 1: "min", 2: "max" })
        .setValue(this.plugin.settings.marginsType.toString())
        .onChange(async (value) => {
          console.log(`[CONFIG] Change marginsType to ${value}`);
          this.plugin.settings.marginsType = parseInt(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Page Size')
      .setDesc('Page size when printing as PDF.')
      .addDropdown(dropdown => dropdown
        .addOptions({ A3: "A3", A4: "A4", A5: "A5", Legal: "Legal", Letter: "Letter", Tabloid: "Tabloid" })
        .setValue(this.plugin.settings.pageSize)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change pageSize to ${value}`);
          this.plugin.settings.pageSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Print Background')
      .setDesc('When toggled on, background will appear when printing as PDF.')
      .addToggle(textarea => textarea
        .setValue(this.plugin.settings.printBackground)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change printBackground to ${value}`);
          this.plugin.settings.printBackground = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('div', {
      text: "この世界は優しくも正しくもないので、優しくて正しい人が生き残ることは常に困難です——比企谷八幡", attr: {
        class: "setting-item-description"
      }
    });



  }




}