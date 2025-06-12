# PlebLib Svelte Stores

Diese Bibliothek bietet Svelte-Stores für die Interaktion mit der Plebbit-API. Sie enthält sowohl die ursprünglichen Stores als auch neue Hooks, die aus dem plebbit-react-hooks Repository portiert wurden.

## Bestehende Stores

Die bestehenden Stores bieten grundlegende Funktionalität für die Interaktion mit der Plebbit-API:

### Feed

```javascript
import { loadFeed, posts, feedLoading, feedError } from '$lib/index';

// Feed laden
await loadFeed({
  subplebbitAddresses: ['plebbit.eth'],
  sortType: 'new',
  limit: 10
});

// Auf Posts zugreifen
$: if ($posts) {
  console.log('Posts:', $posts);
}
```

### Comment

```javascript
import { loadComment, comment, commentLoading, commentError } from '$lib/index';

// Kommentar laden
await loadComment({ commentCid: 'kommentar-cid' });

// Auf Kommentar zugreifen
$: if ($comment) {
  console.log('Kommentar:', $comment);
}
```

### Replies

```javascript
import { loadReplies, replies, repliesLoading, repliesError } from '$lib/index';

// Antworten laden
await loadReplies({ comment: $comment });

// Auf Antworten zugreifen
$: if ($replies) {
  console.log('Antworten:', $replies);
}
```

### Publish

```javascript
import { publishComment, publishing, publishingError, challenge } from '$lib/index';

// Kommentar veröffentlichen
await publishComment({
  subplebbitAddress: 'plebbit.eth',
  content: 'Dies ist ein Testkommentar',
  title: 'Test'
});

// Challenge behandeln
$: if ($challenge) {
  // Challenge anzeigen
}
```

## Neue Hooks

Die neuen Hooks bieten erweiterte Funktionalität für die Interaktion mit der Plebbit-API:

### Accounts

```javascript
import { useAccount, useAccountComments } from '$lib/index';

// Konto abrufen
const account = useAccount({ accountName: 'Account 1' });

// Kommentare eines Kontos abrufen
const { accountComments } = useAccountComments({ accountName: 'Account 1' });
```

### Actions

```javascript
import { useSubscribe, useBlock, usePublishCommentAction } from '$lib/index';

// Subplebbit abonnieren
const { subscribe, unsubscribe } = useSubscribe({
  subplebbitAddress: 'plebbit.eth',
  accountName: 'Account 1'
});

// Adresse oder CID blockieren
const { block, unblock } = useBlock({
  address: 'adresse',
  accountName: 'Account 1'
});

// Kommentar veröffentlichen (alternative Methode)
const { publishComment } = usePublishCommentAction({
  subplebbitAddress: 'plebbit.eth',
  content: 'Dies ist ein Testkommentar',
  title: 'Test',
  accountName: 'Account 1'
});
```

### Authors

```javascript
import { useAuthor, useAuthorComments, useAuthorAvatar } from '$lib/index';

// Autor abrufen
const { author } = useAuthor({
  authorAddress: 'autor-adresse',
  commentCid: 'kommentar-cid'
});

// Kommentare eines Autors abrufen
const { authorComments } = useAuthorComments({
  authorAddress: 'autor-adresse',
  commentCid: 'kommentar-cid'
});

// Avatar eines Autors abrufen
const { imageUrl } = useAuthorAvatar({
  author: author
});
```

## Integration

Die bestehenden Stores und die neuen Hooks sind in einer einheitlichen Schnittstelle integriert. Sie können beide Ansätze in Ihrer Anwendung verwenden, je nachdem, welcher besser zu Ihren Anforderungen passt.

Die bestehenden Stores bieten eine einfachere Schnittstelle für grundlegende Funktionen, während die neuen Hooks erweiterte Funktionen für komplexere Anwendungsfälle bieten.

## Hinweise

- Die neuen Hooks sind aus dem plebbit-react-hooks Repository portiert und bieten die gleiche Funktionalität, aber mit einer Svelte-kompatiblen Schnittstelle.
- Die bestehenden Stores werden weiterhin unterstützt und können zusammen mit den neuen Hooks verwendet werden.
- Die Funktion `usePublishCommentAction` ist eine alternative Methode zur Veröffentlichung von Kommentaren, die zusätzliche Funktionen bietet. Die bestehende Funktion `publishComment` wird weiterhin unterstützt.