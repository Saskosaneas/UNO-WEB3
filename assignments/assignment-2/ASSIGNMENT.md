Web3 Course Assignment 2

# Browser-only Uno against bots

Implement an Uno game that works in the browser. It doesn't need to save to a server or anywhere else. This exercise focuses on developing a user interface.

## Requirements

### Must have

The following features are required:

- The player should be able to play one round of Uno against 1-3 players. Either:
  - Create bots to play against
    - The bots need to play according to the rules
    - The bots can play as smart or stupid as you want (but according to the rules)
    - The bots should be implemented as [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers), using only postMessage and onmessage to communicate to make it easier to move them to the server later
  - Combine this with assignment 3 and use real players
- The play should proceed according to as much of the official Uno rules you implemented in assignment 1
- The application must have a screen for setting up a game
- The application must have a screen for playing
- The application must be implemented in Vue.js. It can be either options or composition API but be consistent.

### Should have

- (If you use bots) The bots should sometimes but not always forget to say Uno
- (If you use bots) The bots should sometimes but not always catch when another player forgets to say Uno
- The application should have a game over screen indicating the result

### Could have

- Play an entire game (with score) of Uno against 1-3 players
- The application could have a "between rounds" screen indicating the state of the match.

Things to consider:

- What is the best way to handle state management?

# The hand-in

- Groups: 2-4 people.
- Hand-in a zip file with the project.
- Deadline is 18 October