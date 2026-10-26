
package com.placement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.placement.entity.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByCareerPreferenceIgnoreCase(String careerPreference);

    List<Student> findByPlacementStatusIgnoreCase(String placementStatus);

    long countByCareerPreferenceIgnoreCase(String careerPreference);

    long countByPlacementStatusIgnoreCase(String placementStatus);
}
