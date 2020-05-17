import { BaseIds } from '../entities/base-media';

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

export function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
}

export function mergeDeep(target, source) {
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  return target;
}

export function isSameId(sourceIds: BaseIds, targetIds: BaseIds) {
  if (!sourceIds || !targetIds) {
    return false;
  }
  return (
    (sourceIds.trakt && targetIds.trakt && +sourceIds.trakt === +targetIds.trakt) ||
    (sourceIds.imdb && targetIds.imdb && sourceIds.imdb.toString() === targetIds.imdb.toString()) ||
    (sourceIds.tmdb && targetIds.tmdb && +sourceIds.tmdb === +targetIds.tmdb) ||
    (sourceIds.tvdb && targetIds.tvdb && sourceIds.tvdb.toString() === targetIds.tvdb.toString()) ||
    (sourceIds.simkl && targetIds.simkl && +sourceIds.simkl === +targetIds.simkl)
  );
}
