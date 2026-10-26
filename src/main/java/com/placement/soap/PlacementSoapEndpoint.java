
package com.placement.soap;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import com.placement.entity.Student;
import com.placement.repository.StudentRepository;
import com.placement.soap.generated.GetStudentRequest;
import com.placement.soap.generated.GetStudentResponse;

@Endpoint
public class PlacementSoapEndpoint {

    private static final String NAMESPACE_URI =
            "http://placement.com/soap";

    private final StudentRepository studentRepository;

    public PlacementSoapEndpoint(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getStudentRequest")
    @ResponsePayload
    public GetStudentResponse getStudent(
            @RequestPayload GetStudentRequest request) {

        Student student = studentRepository.findById(request.getId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Student not found"));

        GetStudentResponse response = new GetStudentResponse();

        response.setId(student.getId());
        response.setEnrollmentNo(student.getEnrollmentNo());
        response.setName(student.getName());
        response.setEmail(student.getEmail());
        response.setBranch(student.getBranch());
        response.setCareerPreference(student.getCareerPreference());
        response.setPlacementStatus(student.getPlacementStatus());

        return response;
    }
}
