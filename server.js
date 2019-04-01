const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Message {
    id: ID!
    content: String
    author: String
  }
  type User {
    id: ID!
    age: Int
    name: String
  }
  type Query {
    getMessage(id: ID!): Message
    user(id: ID!): User
    users: [User]
  }
  input MessageInput {
    content: String
    author: String
  }
  input UserInfo {
    age: Int
    name: String
  }
  type Mutation {
    createMessage(input: MessageInput): Message
    updateMessage(id: ID!, input: MessageInput): Message
    setUser(input: UserInfo): User
  }
`);

// If Message had any complex fields, we'd put them on this object.
class Message {
  constructor(id, {content, author}) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

class User {
  constructor(id, {age, name}) {
    this.id = id;
    this.age = age;
    this.name = name;
  }
}

let fakeDatabase = {};

// The root provides a resolver function for each API endpoint
const root = {
  getMessage: function ({id}) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    return new Message(id, fakeDatabase[id]);
  },
  createMessage: function ({input}) {
    // Create a random id for our "database".
    const id = require('crypto').randomBytes(10).toString('hex');
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage: function ({id, input}) {
    if (!fakeDatabase[id]) {
      throw new Error('no message exists with id ' + id);
    }
    // This replaces all old data, but some apps might want partial update.
    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  user: function ({id}) {
    if (!fakeDatabase[id]) {
      throw new Error('no user exists with id ' + id);
    }
    const u = new User(id, fakeDatabase[id]);
    return u;
  },
  users: function () {
    let hoge = [];
    for(let id of Object.keys(fakeDatabase)) {
      hoge.push(new User(id, fakeDatabase[id]));
    }
    return hoge;
  },
  setUser: function ({input}) {
    const id = require('crypto').randomBytes(10).toString('hex');
    fakeDatabase[id] = input;
    return new User(id, input);
  }
};

const app = express();
app.use('/graphql', cors(), graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');
