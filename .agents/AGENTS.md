# SilverWall — AI Agent Guide

Welcome, Agent. This guide outlines the project architecture, operational rules, and current development sprint goals.

## 1. Codebase Memory & Navigation

This project is indexed using **Graphify**.

* **Do NOT run heavy grep searches or read raw files recursively.**
* Instead, query the pre-built knowledge graph located at `graphify-out/graph.json` by running:
  ```powershell
  & "C:\Users\PUSHAN\.local\bin\graphify.exe" query "<your question>"
  ```
* For relationship mapping: `graphify path "<A>" "<B>"`
* For specific concepts: `graphify explain "<concept>"`

## 2. Active Development Sprint: SpacetimeDB Migration

We are currently undergoing a major architectural pivot from the legacy Python/Supabase backend to a **Full TypeScript + SpacetimeDB** database layer.

* Check the current state of SpacetimeDB tables, standings, and telemetry schemas in `spacetimedb/`.
* The Discord Bot service `/api/discord/interactions` is being integrated with Clerk Auth and direct SpacetimeDB multiplexed sync.
* Ensure real-time telemetry pipelines do not polling-overload the database core.

## 3. Tech Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
* **Database & Sync**: SpacetimeDB (Multiplexed WebSocket streams)
* **Authentication**: Clerk Auth SDK
* **Automation**: GitHub Actions (Sentinel health keepalive workflows)
