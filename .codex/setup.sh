#!/bin/bash
set -e

# Install frontend dependencies (root package.json)
npm install

# Install backend dependencies
npm --prefix backend install
