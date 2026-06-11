export const applySeo = ({ title, description, ogImage }) => {
  if (title) {
    document.title = title;
  }

  const setMeta = (selector, attribute, value) => {
    if (!value) {
      return;
    }

    let tag = document.querySelector(selector);

    if (!tag) {
      tag = document.createElement("meta");

      if (selector.includes("property=")) {
        tag.setAttribute("property", selector.match(/property="([^"]+)"/)?.[1] || "");
      } else {
        tag.setAttribute("name", selector.match(/name="([^"]+)"/)?.[1] || "");
      }

      document.head.appendChild(tag);
    }

    tag.setAttribute(attribute, value);
  };

  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:image"]', "content", ogImage);
};
