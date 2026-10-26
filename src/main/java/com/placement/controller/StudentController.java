
package com.placement.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.placement.entity.Student;
import com.placement.repository.StudentRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentRepository repository;

    public StudentController(StudentRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<Student> addStudent(@Valid @RequestBody Student student) {
        student.setId(null);

        if (student.getCareerPreference() == null) {
            student.setCareerPreference("INTERNSHIP_AND_PLACEMENT");
        }

        if (student.getPlacementStatus() == null) {
            student.setPlacementStatus("PENDING");
        }

        Student savedStudent = repository.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedStudent);
    }

    @GetMapping
    public List<Student> getAllStudents() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody Student student) {

        return repository.findById(id).map(existingStudent -> {
            existingStudent.setEnrollmentNo(student.getEnrollmentNo());
            existingStudent.setName(student.getName());
            existingStudent.setEmail(student.getEmail());
            existingStudent.setBranch(student.getBranch());
            existingStudent.setCareerPreference(student.getCareerPreference());
            existingStudent.setPlacementStatus(student.getPlacementStatus());

            return ResponseEntity.ok(repository.save(existingStudent));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preference/{preference}")
    public List<Student> getByCareerPreference(@PathVariable String preference) {
        return repository.findByCareerPreferenceIgnoreCase(preference);
    }

    @GetMapping("/status/{status}")
    public List<Student> getByPlacementStatus(@PathVariable String status) {
        return repository.findByPlacementStatusIgnoreCase(status);
    }
}
