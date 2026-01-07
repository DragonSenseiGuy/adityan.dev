# Markdown Rendering Test

## 1. Text Formatting

**Bold**
__Bold (alt)__

*Italic*
_Italic (alt)_

***Bold + Italic***
___Bold + Italic (alt)___

~~Strikethrough~~

`Inline code`

---

## 2. Headings

# H1
## H2
### H3
#### H4
##### H5
###### H6

---

## 3. Paragraphs & Line Breaks

This is a paragraph.

This is another paragraph.

This line ends with two spaces for a hard break.  
This should be on a new line.

---

## 4. Blockquotes

> Blockquote
>> Nested blockquote
>>> Triple nested

> **Formatted** text inside a blockquote  
> with line breaks and `code`.

---

## 5. Lists

### Unordered
- Item A
- Item B
  - Nested item
    - Deeply nested
- Item C

### Ordered
1. First
2. Second
   1. Nested
   2. Nested
3. Third

### Mixed
- Item
  1. Sub item
  2. Sub item

---

## 6. Task Lists (GFM)

- [x] Completed
- [ ] Not completed
- [ ] Another task

---

## 7. Links

Inline link: [OpenAI](https://openai.com)

Reference link: [CommonMark][cm]

Autolink: https://example.com

Email: <test@example.com>

[cm]: https://spec.commonmark.org/

---

## 8. Images

Inline image:

![Alt text](https://via.placeholder.com/150 "Image Title")

Reference image:

![Alt text][img]

[img]: https://via.placeholder.com/100

---

## 9. Code Blocks

### Fenced (no language)
```

plain code block
line 2

```

### Fenced (with language)
```python
def hello():
    print("Hello, Markdown!")
```

### Indented

```
indented code
still code
```

---

## 10. Tables (GFM)

| Column A | Column B | Column C |
| -------: | :------: | :------- |
|    Right |  Center  | Left     |
|      123 |    456   | 789      |

---

## 11. Horizontal Rules

---

---

---

---

## 12. Escaping Characters

*Not italic*
**Not bold**
# Not a heading
`Not code`

---

## 13. HTML (Inline & Block)

<span style="color:red">Inline HTML</span>

<div>
  <strong>Block HTML</strong>
</div>

---

## 14. Footnotes (if supported)

Here is a footnote reference[^1].

[^1]: This is the footnote text.

---

## 15. Definition Lists (if supported)

Term
: Definition

Another Term
: Another definition

---

## 16. Emojis (renderer-dependent)

😀 😎 🚀 🔥

---

## 17. Nested Everything

> * **Bold list item**
>
>   * `Code`
>   * [Link](https://example.com)
>
>     1. Ordered
>
>        * Unordered

---
