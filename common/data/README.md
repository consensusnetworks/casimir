# Data Contribution Guide

Data schemas and Jupyter Notebooks for Casimir data exploration, analytics and ML – optimized for lightweight, collaborative workflows

## Prerequisites

If you plan to use @casimir/data as an npm package workspace (to integrate with other npm workspaces in this project), you should follow the [Prerequisites](../../README.md#prerequisites) from the project root. If you plan to use the Jupyter Notebooks in [notebooks/](notebooks/) and want to collaborate in the Casimir data-ops workflows, you need to install the following prerequisite extensions to either: 
    - [VSCode Dev for the Web](https://code.visualstudio.com/docs/editor/vscode-web) (press the `.` key when viewing this page in the `develop` branch on [GitHub.com](https://github.com/consensusnetworks/casimir/tree/feature/data-ops/common/data/README.md)), or
    - Your local VSCode editor (#3 below is not needed for this setup)

1. [Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare) – realtime collaboration.

2. [Jupyter](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.jupyter) – editor support for configuring, viewing, editing, and running notebooks.

3. [Pyolite](https://marketplace.visualstudio.com/items?itemName=joyceerhl.vscode-pyodide) – run python cells in VSCode Dev for the Web using [Pyodide](https://pyodide.org/en/stable/).

> For VSCode Dev for the Web usage, you may also need to configure your browser settings to allow cookies from `[*.]github.dev`. 

## Setup

## Workflows