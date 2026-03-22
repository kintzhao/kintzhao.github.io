import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 所有页面共用的组件
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    // Giscus 评论系统（需在 giscus.app 获取配置后填入）
    Component.Comments({
      provider: "giscus",
      options: {
        repo: "kintzhao/kintzhao.github.io", // ← 改成你的仓库
        repoId: "YOUR_REPO_ID",           // ← 从 giscus.app 获取
        category: "Announcements",
        categoryId: "YOUR_CATEGORY_ID",   // ← 从 giscus.app 获取
        mapping: "pathname",
        strict: true,
        reactionsEnabled: true,
        inputPosition: "top",
      },
    }),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/kintzhao",   // ← 改成你的链接
      RSS订阅: "/index.xml",
    },
  }),
}

// 首页（index.md）布局
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),              // 全文搜索框
    Component.Darkmode(),            // 深色模式切换
    Component.DesktopOnly(Component.Explorer({
      folderClickBehavior: "collapse",
      folderDefaultState: "open",
      sortFn: (a, b) => {
        // 文件夹排在文件前面
        if ((!a.file && !b.file) || (a.file && b.file)) return a.displayName.localeCompare(b.displayName, "zh-CN")
        if (a.file && !b.file) return 1
        return -1
      },
    })),
  ],
  right: [
    Component.Graph({               // 知识图谱（右侧面板）
      localGraph: {
        drag: true,
        zoom: true,
        depth: 2,
        scale: 1.1,
        repulseStrength: 0.5,
        nodeSize: 4,
        linkDistance: 30,
        fontSize: 0.6,
        opacityScale: 1,
        removeSelfloops: true,
        showTags: true,
        focusOnHover: false,
      },
      globalGraph: {
        drag: true,
        zoom: true,
        depth: -1,
        scale: 0.9,
        repulseStrength: 0.5,
        nodeSize: 4,
        linkDistance: 30,
        fontSize: 0.6,
        opacityScale: 1,
        removeSelfloops: true,
        showTags: true,
        focusOnHover: true,
      },
    }),
    Component.DesktopOnly(Component.TableOfContents()), // 文章目录
    Component.Backlinks(),           // 反向链接（哪些文章引用了本文）
  ],
}

// 文件夹列表页布局
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
