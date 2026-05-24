/** Kafka adapter for enterprise scale — Fase 4 */
export type KafkaEventBusConfig = {
  brokers: string[];
  topic: string;
  clientId?: string;
};

export function createKafkaAdapter(_config: KafkaEventBusConfig) {
  return {
    async publish(_event: unknown): Promise<void> {
      throw new Error("Kafka adapter not configured — use BullMQ for MVP");
    },
    async subscribe(_handler: (event: unknown) => Promise<void>): Promise<void> {
      throw new Error("Kafka adapter not configured");
    },
  };
}
