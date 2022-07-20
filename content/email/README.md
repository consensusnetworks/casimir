# Email Contribution Guide

## Setup

### Prerequisites

Install and enable the [MJML VSCode extension](https://marketplace.visualstudio.com/items?itemName=mjmlio.vscode-mjml) to preview templates in development.

### Create New Content

1. Create a new directory with the template files.

    ```zsh
    mkdir content/email/templates/<your-template-name>
    cd content/email/templates/<your-template-name>
    touch index.mjml
    touch template.json
    ```

2. Add the following to the `template.json` file:

    {
        "TemplateName": "%name%",
        "EmailTemplateRequest": {
            "Subject": "your-subject",
            "TemplateDescription": "your-description",
            "TextPart": "%text%",
            "HtmlPart": "%html%"
        }
    }

3. Add your email template code to the `index.mjml` file. See https://mjml.io/ for more information.

4. Extract any shared email template code from the `index.mjml` file and place it in components in the [content/email/shared/](content/email/shared/) directory.

### Live Preview

1. Change into the template directory:
   
    ```zsh
    cd content/email/templates/<your-template-name>
    ```

2. Press `command + shift + p` to open the VSCode command prompt and select `MJML: Open Preview to the Side`.

## Deployment

### Deploy Templates

Templates are deployed with the project GitHub workflows, but you can also deploy them manually by running the deploy script (**from the project root** `../../`). The stage will default to `dev` (which you can override by following [these instructions](../../README.md#environment)).
   
```zsh
npm run deploy:templates
```

> 🚩 Templates are auto-deployed to `dev` on pushes to the `develop` branch and are auto-deployed to `prod` on releases from the `master` branch.


