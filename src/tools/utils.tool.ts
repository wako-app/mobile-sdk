export function getDomainFromUrl(url: string) {
  return url.replace(/http(s)?:\/\//gi, '').split('/')[0];
}

export function wakoLog(category: string, data: any) {
  console.log(`${new Date().toISOString()} - [${category}]:`, data);
}

export function escapeText(text: string) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  text = text.replace(/(\r\n|\n|\r)/gm, ' ');
  text = text.replace(/#/g, '%23');
  text = text.replace(/&/g, '%26');
  text = text.replace(/'/g, '%27');
  text = text.replace(/"/g, '%27%27');
  text = text.replace(/\(/g, '%28');
  text = text.replace(/\)/g, '%29');
  text = text.replace(/\-/g, '%2D');
  text = text.replace(/;/g, '%3B');
  text = text.replace(/</g, '%3C');
  text = text.replace(/\]/g, '%3D');
  text = text.replace(/>/g, '%3E');
  text = text.replace(/\[/g, '%5B');
  text = text.replace(/\{/g, '%7B');
  text = text.replace(/\}/g, '%7D');

  return text;
}

export function replacer(tpl: string, data: { [key: string]: any }) {
  return tpl.replace(/{([^}]+)?}/g, ($1, $2) => {
    return data[$2];
  });
}
