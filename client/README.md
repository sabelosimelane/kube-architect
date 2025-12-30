# 🏗️ Kube Architect

> **A fork of Kube Composer, redesigned as a stateful, namespace-first, deployment-centric Kubernetes builder with a backend and persistent storage (SQLite). Resources are composed in context, exported as YAML today, and positioned for direct cluster provisioning next.**

---

## Overview

**Kube Architect** is a fork of **Kube Composer** with a fundamental architectural shift:
from a **browser-only, static YAML generator** to a **stateful system backed by a server and persistent storage**.

Instead of treating Kubernetes resources as disconnected definitions, Kube Architect models Kubernetes the way it is actually used in real clusters—**namespaces first, deployments at the center, and related resources composed in context**.

---

## Why This Fork Exists

The original Kube Composer implementation has several structural limitations:

* ❌ State stored in browser localStorage (ephemeral)
* ❌ Flat resource model (namespaces, deployments, services live separately)
* ❌ Limited depth in deployment configuration
* ❌ Poor alignment with real cluster workflows (e.g. Rancher-style composition)

Kube Architect addresses these gaps by introducing:

* A backend service
* Persistent state using **SQLite**
* A hierarchical, cluster-aligned data model

---

## Core Design Model

> **Namespace → Deployment → Attached Resources**

* **Namespaces** are the top-level boundary
* **Deployments** are the primary unit of work
* Networking, configuration, and storage are defined **inside the deployment that consumes them**

No global resource pool. No floating YAML.

---

## What You Can Do Today

### 🧠 Stateful Backend

* Backend service with **SQLite persistence**
* Configurations survive reloads and browser restarts
* Enables validation, relationships, and future cluster interaction

### 📁 Namespace-First Navigation

* Namespaces are the entry point
* Selecting a namespace shows all deployments under it

### 🧩 Deployment-Centric Composition

From within a deployment, you can define:

* **Services**

  * ClusterIP
  * LoadBalancer
* **Ingress**
* **ConfigMaps**

  * env / envFrom
  * volume mounts
* **Persistent Volume Claims (PVCs)**
* **NetworkPolicies**

This mirrors how tools like Rancher allow you to attach infrastructure *to the workload*, not alongside it.

---

## Output Model

* Export **Kubernetes YAML**

  * Namespace-scoped
  * Deployment-centric
  * Compatible with `kubectl`, GitOps workflows, and tools like Headlamp

YAML remains the source of truth for now.

---

## Cluster Provisioning (Next Step)

Because this project already includes:

* a backend
* persistent state
* structured resource relationships

Adding direct cluster provisioning becomes an **incremental evolution**, not a rewrite:

* Validate manifests
* Apply to a Kubernetes cluster
* Surface errors and status per deployment

---

## Scope (Initial)

### Included

* Namespaces
* Deployments
* Services (ClusterIP, LoadBalancer)
* Ingress
* ConfigMaps
* PVCs
* NetworkPolicies

### Explicitly Out of Scope (for now)

* RBAC
* Multi-cluster management
* Full Rancher parity

---

## Architectural Direction

Kube Architect intentionally avoids:

* Browser-only storage
* Flat resource pools
* Premature multi-cluster complexity

It focuses instead on:

* Correct structure
* Persistent state
* Real-world Kubernetes composition

---

## Philosophy

Kubernetes is not a pile of YAML files.
It is a **graph of related resources**, scoped by namespaces and centered around workloads.

Kube Architect makes that graph explicit.

---

## Relationship to Upstream

This project is a **fork of Kube Composer**.
Divergence is intentional and driven by architectural goals, not cosmetic changes.
