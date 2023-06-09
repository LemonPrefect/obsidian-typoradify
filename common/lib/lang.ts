import i18next from "i18next";
import engb from "../../locales/engb.json" assert { type: "json" };
import zhcn from "../../locales/zhcn.json" assert { type: "json" };
import zhhk from "../../locales/zhhk.json" assert { type: "json" };
import zhtw from "../../locales/zhtw.json" assert { type: "json" };

const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;

i18next
  .init({
    fallbackLng: "en-GB",
    interpolation: {
      escapeValue: false
    },
    resources: {
      "zh-CN": {
        translation: zhcn,
      },
      "zh-TW": {
        translation: zhtw,
      },
      "zh-HK": {
        translation: zhhk,
      },
      "en-GB": {
        translation: engb,
      },
    }
  });

export default (lang: string | undefined | null = undefined) => i18next.getFixedT(lang || systemLocale);