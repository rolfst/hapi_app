import conversationRoutes from './conversation';

export function createRoutes(server) {
  [
    ...conversationRoutes,
  ].map(route => server.route(route));
}
