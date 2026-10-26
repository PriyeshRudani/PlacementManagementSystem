
package com.placement.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.placement.repository.StudentRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final StudentRepository studentRepository;

    public DashboardController(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @GetMapping("/statistics")
    public Map<String, Long> getStatistics() {

        Map<String, Long> statistics = new LinkedHashMap<>();

        statistics.put("totalStudents", studentRepository.count());

        statistics.put(
                "placedStudents",
                studentRepository.countByPlacementStatusIgnoreCase("PLACED"));

        statistics.put(
                "pendingStudents",
                studentRepository.countByPlacementStatusIgnoreCase("PENDING"));

        statistics.put(
                "internshipAndPlacement",
                studentRepository.countByCareerPreferenceIgnoreCase(
                        "INTERNSHIP_AND_PLACEMENT"));

        statistics.put(
                "internshipOnly",
                studentRepository.countByCareerPreferenceIgnoreCase(
                        "INTERNSHIP_ONLY"));

        statistics.put(
                "ownBusiness",
                studentRepository.countByCareerPreferenceIgnoreCase(
                        "OWN_BUSINESS"));

        statistics.put(
                "placementOnly",
                studentRepository.countByCareerPreferenceIgnoreCase(
                        "PLACEMENT_ONLY"));

        return statistics;
    }
}
