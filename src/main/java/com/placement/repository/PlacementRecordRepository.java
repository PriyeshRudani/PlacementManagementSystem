
package com.placement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.placement.entity.PlacementRecord;

public interface PlacementRecordRepository
        extends JpaRepository<PlacementRecord, Long> {

    List<PlacementRecord> findByStudentId(Long studentId);

    List<PlacementRecord> findByCompanyNameIgnoreCase(String companyName);

    List<PlacementRecord> findByApplicationStatusIgnoreCase(
            String applicationStatus);
}
