# Email Templates

## Development

Install and enable the [MJML VSCode extension](https://marketplace.visualstudio.com/items?itemName=mjmlio.vscode-mjml) to preview templates in development.

### Create a new template

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
            "Subject": "<your-subject>",
            "TemplateDescription": "<your-description>",
            "TextPart": "%text%",
            "HtmlPart": "%html%"
        }
    }

3. Add your email template code to the `index.mjml` file. See https://mjml.io/ for more information.

4. Extract any shared email template code from the `index.mjml` file and place it in components in the [content/emails/shared/](content/emails/shared/) directory.

### Live preview a template

1. Change into the template directory:
   
    ```zsh
    cd content/emails/templates/<your-template-name>
    ```

2. Press `command + shift + p` to open the VSCode command prompt and select `MJML: Open Preview to the Side`.

## Deployment

### Deploy templates

Templates are deployed with the project GitHub workflows, but you can also deploy them manually by running (:warning: from the project root):

    ```zsh
    npm run deploy:templates
    ```


