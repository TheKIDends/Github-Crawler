import showdown from "showdown";

let converter = new showdown.Converter();

export function mdToHtml(text) {
    return converter.makeHtml(text);
}