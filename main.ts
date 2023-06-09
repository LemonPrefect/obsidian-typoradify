import { App, FileSystemAdapter, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import path from 'path';
import Renderer from 'common/lib/render';
import i18n from "./common/lib/lang";

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

const t = i18n();

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
      name: t("command.html"),
      callback: async () => {
        new Notice(t("notice.html", { filename: path.basename(await this.getCurrentFile() as string) }) as string);
        await Renderer.renderHTML(global, await this.getCurrentFile() as string);
      }
    });

    this.addCommand({
      id: 'render-raw-html',
      name: t("command.rawhtml"),
      callback: async () => {
        new Notice(t("notice.rawhtml", { filename: path.basename(await this.getCurrentFile() as string) }) as string);
        await Renderer.renderRawHTML(global, await this.getCurrentFile() as string);
      }
    });

    this.addCommand({
      id: 'render-pdf',
      name: t("command.pdf"),
      callback: async () => {
        new Notice(t("notice.pdf", { filename: path.basename(await this.getCurrentFile() as string) }) as string);
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
      text: t("title") as string, attr: {
        class: "setting-item-name"
      }
    });
    containerEl.createEl('div', {
      text: t("description") as string, attr: {
        class: "setting-item-description"
      }
    });
    containerEl.createEl('h2', { text: t("setting.parser.title") as string });

    new Setting(containerEl)
      .setName(t("setting.parser.autoNumbering.name") as string)
      .setDesc(t("setting.parser.autoNumbering.description") as string)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoNumbering)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change autoNumbering to ${value}`);
          this.plugin.settings.autoNumbering = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.parser.applyLineBreaks.name") as string)
      .setDesc(t("setting.parser.applyLineBreaks.description") as string)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.applyLineBreaks)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change applyLineBreaks to ${value}`);
          this.plugin.settings.applyLineBreaks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.parser.displayLineNumbers.name") as string)
      .setDesc(t("setting.parser.displayLineNumbers.description") as string)
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.displayLineNumbers)
        .onChange(async (value: boolean) => {
          console.log(`[CONFIG] Change displayLineNumbers to ${value}`);
          this.plugin.settings.displayLineNumbers = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.parser.theme.name") as string)
      .setDesc(t("setting.parser.theme.description") as string)
      .addText(text => text
        .setPlaceholder(t("setting.parser.theme.placeholder") as string)
        .setValue(this.plugin.settings.theme)
        .onChange(async (value: string) => {
          console.log(`[CONFIG] Change theme file to ${value}`);
          this.plugin.settings.theme = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.parser.customCss.name") as string)
      .setDesc(t("setting.parser.customCss.description") as string)
      .addTextArea(textarea => textarea
        .setPlaceholder(t("setting.parser.customCss.placeholder") as string)
        .setValue(this.plugin.settings.customCss)
        .onChange(async (value: string) => {
          console.log(`[CONFIG] Change customCss to ${value}`);
          this.plugin.settings.customCss = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h2', { text: t("setting.printer.title") as string });

    new Setting(containerEl)
      .setName(t("setting.printer.landscape.name") as string)
      .setDesc(t("setting.printer.landscape.description") as string)
      .addDropdown(dropdown => dropdown
        .addOptions({ "false": t("setting.printer.landscape.option.portrait") as string, "true": t("setting.printer.landscape.option.landscape") as string })
        .setValue((this.plugin.settings.landscape ? "true" : "false"))
        .onChange(async (value) => {
          console.log(`[CONFIG] Change landscape to ${value}`);
          this.plugin.settings.landscape = (value === "true");
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.printer.marginsType.name") as string)
      .setDesc(t("setting.printer.marginsType.description") as string)
      .addDropdown(dropdown => dropdown
        .addOptions({ 0: t("setting.printer.marginsType.option.default") as string, 1: t("setting.printer.marginsType.option.min") as string, 2: t("setting.printer.marginsType.option.max") as string })
        .setValue(this.plugin.settings.marginsType.toString())
        .onChange(async (value) => {
          console.log(`[CONFIG] Change marginsType to ${value}`);
          this.plugin.settings.marginsType = parseInt(value);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.printer.pageSize.name") as string)
      .setDesc(t("setting.printer.pageSize.description") as string)
      .addDropdown(dropdown => dropdown
        .addOptions({ A3: "A3", A4: "A4", A5: "A5", Legal: "Legal", Letter: "Letter", Tabloid: "Tabloid" })
        .setValue(this.plugin.settings.pageSize)
        .onChange(async (value) => {
          console.log(`[CONFIG] Change pageSize to ${value}`);
          this.plugin.settings.pageSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName(t("setting.printer.printBackground.name") as string)
      .setDesc(t("setting.printer.printBackground.description") as string)
      .addToggle(toggle => toggle
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