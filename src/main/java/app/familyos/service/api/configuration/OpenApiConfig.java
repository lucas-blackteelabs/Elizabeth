package app.familyos.service.api.configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@SecurityScheme(name = "Bearer Authentication", type = SecuritySchemeType.HTTP, bearerFormat = "JWT", scheme = "bearer")
@OpenAPIDefinition(
        info = @Info(title = "Family OS Service", version = "0.1.0", description = "Agentic household operating system API"),
        security = {@SecurityRequirement(name = "Bearer Authentication")},
        servers = {
                @Server(url = "http://localhost:8080/api", description = "Local"),
                @Server(url = "http://localhost:5000/api", description = "Local (EB port)")
        }
)
public class OpenApiConfig {
}
