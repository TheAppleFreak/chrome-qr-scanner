# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.188.0/containers/ubuntu/.devcontainer/base.Dockerfile

# [Choice] Ubuntu version: bionic, focal
ARG VARIANT="focal"
FROM mcr.microsoft.com/vscode/devcontainers/base:0-${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
RUN export DEBIAN_FRONTEND=noninteractive
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -

RUN apt update 
RUN apt install -y --no-install-recommends nodejs

RUN npm i -g rimraf npm npm-check-updates