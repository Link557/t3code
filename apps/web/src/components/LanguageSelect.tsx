import { useI18n } from "../i18n/WebI18nContext";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "./ui/select";

export function LanguageSelect() {
  const { interfaceLanguage, setAppLocale, t } = useI18n();
  const labels = {
    en: "English",
    "zh-CN": "简体中文",
  };

  return (
    <Select
      value={interfaceLanguage}
      onValueChange={(value) => {
        if (value === "en" || value === "zh-CN") setAppLocale(value);
      }}
    >
      <SelectTrigger size="sm" aria-label={t("settings.language.label")}>
        <SelectValue>{interfaceLanguage === "zh-CN" ? labels["zh-CN"] : labels.en}</SelectValue>
      </SelectTrigger>
      <SelectPopup align="end" alignItemWithTrigger={false}>
        <SelectItem value="en" lang="en">
          {labels.en}
        </SelectItem>
        <SelectItem value="zh-CN" lang="zh-CN">
          {labels["zh-CN"]}
        </SelectItem>
      </SelectPopup>
    </Select>
  );
}
