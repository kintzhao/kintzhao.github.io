import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * 个人知识管理网站 — Quartz v4 配置
 * 修改 configuration 中的个人信息后即可使用
 */
const config: QuartzConfig = {
  configuration: {
    // ========== 请修改以下个人信息 ==========
    pageTitle: "📚 我的知识库",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,         // 鼠标悬停预览链接内容
    analytics: {
      provider: "plausible",      // 换成 "google" 并填 tagId 可用 GA
    },
    locale: "zh-CN",
    baseUrl: "kintzhao.github.io",  // ← 改成你的 GitHub 用户名
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Noto Serif SC",   // 标题字体
        body: "Noto Sans SC",      // 正文字体
        code: "JetBrains Mono",    // 代码字体
      },
      colors: {
        lightMode: {
          light: "#faf8f1",        // 页面背景（米白）
          lightgray: "#e8e4d9",    // 边框色
          gray: "#b8b0a0",         // 次要文字
          darkgray: "#3d3530",     // 正文文字
          dark: "#1a1512",         // 标题文字
          secondary: "#5b7fa6",    // 链接/强调色（蓝灰）
          tertiary: "#84a98c",     // 访问过的链接（绿）
          highlight: "rgba(91,127,166,0.12)",
          textHighlight: "#ffd58080",
        },
        darkMode: {
          light: "#1c1917",        // 深色背景
          lightgray: "#2a2520",
          gray: "#6b635a",
          darkgray: "#d4cfc8",
          dark: "#f0ebe3",
          secondary: "#7fa8cc",
          tertiary: "#95b89e",
          highlight: "rgba(127,168,204,0.12)",
          textHighlight: "#b3aa0040",
        },
      },
    },
  },

  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),           // 自动生成目录
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }), // 数学公式支持
    ],
    filters: [Plugin.RemoveDrafts()],     // draft: true 的文章不发布
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,                  // RSS 订阅
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
