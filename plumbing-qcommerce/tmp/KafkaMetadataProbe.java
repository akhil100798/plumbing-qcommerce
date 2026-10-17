import java.util.Properties;
import java.util.stream.Collectors;
import org.apache.kafka.clients.admin.AdminClient;

public final class KafkaMetadataProbe {
  public static void main(String[] args) throws Exception {
    Properties properties = new Properties();
    properties.put("bootstrap.servers", args.length > 0 ? args[0] : "localhost:29092");
    properties.put("request.timeout.ms", "10000");
    properties.put("default.api.timeout.ms", "10000");
    try (AdminClient client = AdminClient.create(properties)) {
      String nodes = client.describeCluster().nodes().get().stream()
          .map(node -> node.host() + ":" + node.port())
          .sorted()
          .collect(Collectors.joining(","));
      String topics = client.listTopics().names().get().stream().sorted().collect(Collectors.joining(","));
      System.out.println("advertisedNodes=" + nodes);
      System.out.println("topics=" + topics);
    }
  }
}
