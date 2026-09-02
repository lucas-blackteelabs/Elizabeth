package app.familyos.service.domain.users;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsernameAndActiveIsTrue(String username);

    boolean existsByUsername(String username);
}
