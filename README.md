# Cekopt
This is a simple app that when you log into it will sort your unread items by length (time to read).

## Usage
```js
npm install
KEY={{consumer_key}} PASS={{pass}} PARSER_TOKEN={{parser_token}} node index.js
```

### Options
* `consumer_key` - This is pocket's consumer key
* `parser_token` - This is readability's parser token
* `pass` - Password to use for encrypting session data. If not given, it will automatically generate one.

## Name
The name comes from ordering Pocket alphabetically:

```js
Array.prototype.slice.call('pocket').sort().join('')
```

Kindly suggested to me by [@ljharb](//github.com/ljharb).
