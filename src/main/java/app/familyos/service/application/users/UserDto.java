package app.familyos.service.application.users;

import app.familyos.service.domain.users.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDto {
    private String id;
    private String name;
    private String username;
    private String password;
    private String timeZone;
    private String householdId;

    public static UserDto fromEntity(User u) {
        return UserDto.builder().id(u.getId()).name(u.getName()).username(u.getUsername()).timeZone(u.getTimeZone()).householdId(u.getHouseholdId()).build();
    }
}
