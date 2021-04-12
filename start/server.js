const app = require('./app');

const PORT = process.env.PORT || 3333;

// eslint-disable-next-line no-console
const server = app.listen(PORT, () => console.log(`running on ${PORT}`));

server.setTimeout(500000);
