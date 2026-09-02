package app.familyos.service.domain.proposals;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProposalRepository extends MongoRepository<Proposal, String> {
    List<Proposal> findAllByHouseholdId(String householdId);

    void deleteAllByHouseholdId(String householdId);
}
