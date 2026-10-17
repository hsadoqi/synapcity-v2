export default [
  {
    key: 'email',
    label: 'Email notifications',
    description: 'Keep your preference for occasional updates by email.',
  },
  {
    key: 'push',
    label: 'Push notifications',
    description:
      'Allow browser notifications when notification delivery is connected.',
  },
  {
    key: 'sound',
    label: 'Notification sounds',
    description: 'Play a soft sound when a notification arrives.',
  },
] as const;
