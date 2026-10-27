# INTERVENTION — Valsane Studio

**Prototype 01 — Libération d'otages.** Jeu tactique 3D dans le navigateur, créé à partir du projet ZONE ZÉRO mais développé dans un dépôt indépendant.

## Principe

Vous dirigez une unité d'intervention de quatre opérateurs dans un complexe de huit pièces, avec des portes et des couloirs.

- L'objectif de la démo est de **sécuriser trois otages vivants**.
- Chaque agent peut être sélectionné puis placé devant une porte.
- Un clic sur une porte orange ouvre la préparation des ordres.
- Chaque fiche d'agent possède un bouton **+** permettant d'empiler des instructions :
  - **Ouvrir la porte et viser** : rejoint la porte, l'ouvre, reste dans le couloir et tire automatiquement sur les menaces visibles.
  - **Ouvrir la porte et entrer** : rejoint la porte, l'ouvre, puis progresse dans la pièce en tirant automatiquement sur les menaces visibles.
  - **Suivre une personne** : suit l'opérateur choisi lorsqu'il se déplace.
- Chaque instruction accepte un **délai de 0 à 30 secondes**, appliqué après la fin de l'instruction précédente.
- **Exécuter** déclenche l'ensemble des séquences d'agents en parallèle.
- **Revenir en préparation** arrête le démarrage des ordres suivants, sans réinitialiser la mission ; on peut programmer la pièce suivante.
- Une porte ouverte révèle les menaces et les otages dans cette pièce.
- Un otage est sauvé lorsqu'un opérateur s'approche, après neutralisation des menaces de sa pièce.

Les tirs sont automatiques ; il n'y a pas de visée manuelle. La stratégie vient du placement et de la synchronisation des ordres.

## Contrôles

| Action | Commande |
|---|---|
| Sélectionner | Clic sur opérateur ou touches 1 à 4 |
| Sélectionner plusieurs | Maj + glisser pour tracer un lasso, ou Maj + clic |
| Déplacer les agents choisis | Clic sur une position praticable |
| Déplacer la caméra | Glisser la souris |
| Zoomer | Molette |
| Préparer une entrée | Clic sur une porte orange |
| Ajouter un ordre individuel | Bouton + dans la fiche de l'agent |
| Préparer / Exécuter | Bouton dédié ou touche P |
| Pause | Espace |

## État du prototype

- Le complexe et les unités sont générés avec Three.js.
- Huit pièces, plusieurs menaces et trois otages.
- Les portes bloquent le déplacement tant qu'elles restent fermées.
- Déplacement par grille et navigation BFS, visibilité au travers des portes ouvertes.
- Interactions par clic, lasso, séquences différées.
- Les murs et les meubles sont simplifiés. Les combats sont volontairement abstraits et devront être rééquilibrés.

Le navigateur charge Three.js depuis jsDelivr : une connexion Internet est nécessaire. La publication GitHub Pages est prévue via le workflow GitHub Actions.

Cette démo n'est pas un simulateur réel d'intervention. Les mouvements, délais et comportements sont des mécaniques de jeu fictives.

© Valsane Studio.
