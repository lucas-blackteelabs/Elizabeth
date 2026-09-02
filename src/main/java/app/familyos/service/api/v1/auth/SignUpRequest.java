package app.familyos.service.api.v1.auth;

import app.familyos.service.application.users.UserDto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignUpRequest {
    @NotBlank
    private String name;
    @NotBlank
    @Email
    private String username;
    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
    private String timeZone;

    public UserDto toDto() {
        return UserDto.builder().name(name).username(username).password(password).timeZone(timeZone).build();
    }
}
