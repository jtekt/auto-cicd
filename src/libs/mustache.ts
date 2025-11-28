import mustache from "mustache";

export const parseTemplate = (template: string, templateData: {}) => {
  return mustache.render(template, templateData, undefined, {
    escape: (text) => text, // Disable HTML escaping
  });
};
