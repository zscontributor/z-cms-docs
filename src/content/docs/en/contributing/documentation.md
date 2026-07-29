---
title: Contribute to the documentation
description: Write and review documentation for Z-CMS.
sidebar:
  order: 2
---

Documentation is stored as Markdown or MDX and reviewed through pull requests.

## Writing principles

- Start with the reader's goal.
- Keep each page focused on one task or one main concept.
- Use the same menu names and labels as the Admin interface.
- Make sure examples work with the version stated on the page.
- Never include secrets, credentials or real customer data in examples.
- Update documentation in the same pull request as a product behavior change.

## Minimum frontmatter

```yaml
---
title: A clear title
description: One sentence describing what the reader will achieve.
---
```

Use the same relative path in every locale so the language switcher can link translations correctly.
