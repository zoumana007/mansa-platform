# Kiosk Gateway — plan d'implémentation aligné sur les contrats

## Statut

Ce document décrit le prochain socle technique pour rendre `Access & Mobility` indépendant des fabricants de bornes. Il est volontairement séparé des contrats métier déjà publiés afin d'éviter de mélanger protocole matériel et objets financiers.

Le contrat partagé actuel couvre déjà :

- `AccessTerminalProfile` ;
- `AccessCashValidationEvent` ;
- `AccessTerminalDisplayState` ;
- `AccessServiceAvailability` ;
- `AccessEquipmentHealth` ;
- `DUAL_HEIGHT` ;
- les deux modes QR Mansa ;
- `CASH_RECYCLER` et `COIN_RECYCLER` ;
- les états de validation cash.

Le Gateway doit consommer ces contrats sans changer leur sens.

## Architecture cible

```text
packages/contracts
      |
      v
services/access-mobility
      |
      v
services/kiosk-gateway
      |
      +-- adapters/simulated
      +-- adapters/vendor-*
      +-- protocols/http
      +-- protocols/serial
      +-- protocols/mdb
      +-- protocols/gpio
      |
      v
hardware / lane controller
```

Le nom d'un fabricant ne doit jamais apparaître dans le coeur du moteur d'accès. Les dépendances propriétaires restent confinées dans `adapters/vendor-*`.

## Interfaces internes proposées

```ts
export interface KioskAdapter {
  readonly provider: string;
  readonly model: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getCapabilities(): Promise<readonly string[]>;
  getHealth(): Promise<readonly EquipmentHealthSnapshot[]>;
  execute(command: KioskCommand): Promise<KioskCommandResult>;
}

export interface CashDeviceAdapter {
  getInventory(): Promise<CashInventorySnapshot>;
  canAccept(amountMinor: number, currency: string): Promise<boolean>;
  canReturnChange(amountMinor: number, currency: string): Promise<boolean>;
}
```

Ces interfaces sont internes à l'intégration et ne deviennent un contrat public que lorsqu'elles sont stabilisées.

## Règles de conception

- aucune clé ou mot de passe dans le dépôt ;
- configuration injectée ;
- adaptateurs remplaçables ;
- simulateur obligatoire pour CI et développement ;
- idempotence pour les commandes à effet ;
- corrélation sur chaque passage/transaction ;
- timeouts explicites ;
- retry uniquement lorsqu'il est sûr ;
- aucune ouverture de barrière répétée aveuglément ;
- aucun paiement considéré final sur la seule réponse d'un périphérique ;
- logs structurés sans données carte sensibles ;
- erreurs constructeur traduites vers des codes normalisés.

## Capacités à normaliser

```text
BANK_CARD
NFC
QR_SCANNER
QR_DISPLAY
MOBILE_MONEY
CASH_BILL_ACCEPT
CASH_COIN_ACCEPT
CASH_BILL_CHANGE
CASH_COIN_CHANGE
RECEIPT_PRINT
INTERCOM
RFID_UHF
ANPR
BARRIER_CONTROL
VEHICLE_SENSORS
OFFLINE_MODE
```

Le mapping vers `AccessPaymentMethod` doit être calculé. Par exemple, `CASH_BILL_ACCEPT` n'implique pas automatiquement que `CASH_BILLS` doit être affiché si le recycler est en panne et que la politique exige de rendre la monnaie.

## Machine d'état locale

États internes recommandés :

```text
BOOTING
CONNECTING
READY
DEGRADED
OFFLINE
MAINTENANCE
SHUTTING_DOWN
```

Un état Gateway ne remplace pas `AccessServiceStatus`. Le service métier agrège l'état des composants et décide de la disponibilité publique.

## Cycle cash

```text
amount due
  -> verify currency profile
  -> verify acceptor health
  -> verify change policy / float
  -> enable validator
  -> receive accepted/rejected instrument events
  -> update inserted total
  -> if enough: compute change
  -> dispense change
  -> verify dispense result
  -> finalize payment orchestration
  -> disable validator
```

Aucun événement `REJECTED_SUSPECT` ne doit être converti en déclaration de contrefaçon certaine.

## XOF

L'activation de `XOF` pour une borne physique doit être liée à un profil de compatibilité validé en recette : fabricant, modèle, firmware, dataset monétaire, billets/pièces testés et date de validation.

Une simple présence de `XOF` dans `supportedCurrencies` ne prouve pas la compatibilité matérielle ; ce champ représente l'autorisation configurée côté Mansa.

## Double hauteur

Une borne `DUAL_HEIGHT` représente une seule session de passage. Les deux façades doivent partager un verrou de transaction pour éviter qu'un conducteur lance deux paiements en parallèle depuis les interfaces haute et basse.

Le contrôleur de voie doit identifier la session par `correlationId` et n'autoriser qu'une finalisation.

## Simulateur de référence

Le premier adaptateur à implémenter doit être `simulated`. Il permettra de reproduire :

- carte disponible/indisponible ;
- QR disponible/indisponible ;
- billet accepté/rejeté ;
- pièce acceptée/rejetée ;
- coffre plein ;
- recycler bas ;
- rendu réussi ;
- rendu partiel ;
- bourrage ;
- imprimante hors ligne ;
- interphone hors ligne ;
- barrière ouverte/fermée ;
- capteur véhicule ;
- perte/reprise de réseau.

Les tests de conformité des futurs adaptateurs réutiliseront la même suite de scénarios.

## Tests minimums

1. capacités déterministes ;
2. retrait d'un moyen de paiement lors d'une panne ;
3. pas de double paiement en double hauteur ;
4. déduplication d'un événement cash répété ;
5. timeout matériel ;
6. reprise après reconnexion ;
7. indisponibilité du rendu ;
8. rendu partiel crée un incident au lieu de terminer silencieusement ;
9. fermeture sûre de la barrière ;
10. aucune donnée sensible dans les erreurs sérialisées.

## Découpage de réalisation

### Étape A — modèles internes

Créer les types de capacités, commandes, résultats, inventaire cash et erreurs normalisées.

### Étape B — simulateur

Implémenter `SimulatedKioskAdapter` et les scénarios de panne.

### Étape C — orchestrateur Gateway

Ajouter connexion, health polling, événements, corrélation, déduplication, timeout et backoff.

### Étape D — intégration Access & Mobility

Transformer l'état agrégé du Gateway en `AccessEquipmentHealth`, `AccessServiceAvailability` et `AccessTerminalDisplayState`.

### Étape E — premier matériel réel

Ajouter un adaptateur uniquement après réception de la documentation officielle du matériel choisi. Les secrets et SDK binaires propriétaires ne doivent pas être commités sans validation de licence et de sécurité.

## Definition of Done

Le socle Gateway est terminé lorsque le simulateur et au moins un adaptateur réel passent la même suite de conformité, que le moteur Access & Mobility n'importe aucun SDK constructeur et que les moyens affichés sur la borne reflètent correctement les capacités et pannes remontées.
