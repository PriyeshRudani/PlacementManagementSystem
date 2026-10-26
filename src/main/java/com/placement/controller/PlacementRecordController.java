
package com.placement.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.placement.entity.PlacementRecord;
import com.placement.entity.Student;
import com.placement.repository.PlacementRecordRepository;
import com.placement.repository.StudentRepository;

@RestController
@RequestMapping("/api/placement-records")
public class PlacementRecordController {

    private final PlacementRecordRepository placementRepository;
    private final StudentRepository studentRepository;

    public PlacementRecordController(
            PlacementRecordRepository placementRepository,
            StudentRepository studentRepository) {
        this.placementRepository = placementRepository;
        this.studentRepository = studentRepository;
    }

    @PostMapping
    public ResponseEntity<?> addPlacementRecord(
            @RequestBody PlacementRecord record) {

        if (record.getStudent() == null
                || record.getStudent().getId() == null) {
            return ResponseEntity.badRequest()
                    .body("Student ID is required");
        }

        Long studentId = record.getStudent().getId();

        return studentRepository.findById(studentId)
                .map(student -> {
                    record.setId(null);
                    record.setStudent(student);

                    PlacementRecord saved =
                            placementRepository.save(record);

                    if ("OFFERED".equalsIgnoreCase(
                            saved.getApplicationStatus())) {
                        student.setPlacementStatus("PLACED");
                        studentRepository.save(student);
                    }

                    return ResponseEntity.status(HttpStatus.CREATED)
                            .body(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<PlacementRecord> getAllRecords() {
        return placementRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlacementRecord> getRecordById(
            @PathVariable Long id) {

        return placementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public List<PlacementRecord> getRecordsByStudent(
            @PathVariable Long studentId) {
        return placementRepository.findByStudentId(studentId);
    }

    @GetMapping("/company/{companyName}")
    public List<PlacementRecord> getRecordsByCompany(
            @PathVariable String companyName) {
        return placementRepository
                .findByCompanyNameIgnoreCase(companyName);
    }

    @GetMapping("/status/{status}")
    public List<PlacementRecord> getRecordsByStatus(
            @PathVariable String status) {
        return placementRepository
                .findByApplicationStatusIgnoreCase(status);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        if (!placementRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        placementRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
