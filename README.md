
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1dQEPCWbm79LXQgmmOka2uWTXjpHJhmvi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
 -npm install
 -npm install @google/genai
 -npm install -D @types/node ts-node typescript
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
 -node --loader ts-node/esm services/main.ts

Backend: vào file SecurityConfig.java
package com.cmc.meeting.web.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer; // << THÊM IMPORT NÀY
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, 
                          CustomUserDetailsService customUserDetailsService) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Cấu hình CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Cho phép frontend Vite và các client khác (như ts-node)
        // Dùng List.of("*") để cho phép mọi nguồn gốc gọi API
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "*")); 
        
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true); 
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); 
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // === SỬA 1: ÁP DỤNG CORS ===
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // === SỬA 2: TẮT CSRF (Rất quan trọng) ===
            .csrf(AbstractHttpConfigurer::disable) // Dùng AbstractHttpConfigurer::disable
            
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) 
            .httpBasic(httpBasic -> httpBasic.disable()) 
            .formLogin(formLogin -> formLogin.disable())

            // === SỬA 3: SẮP XẾP LẠI THỨ TỰ QUYỀN ===
            .authorizeHttpRequests(authorize -> authorize
                
                // 1. Đặt quy tắc CỤ THỂ (register) lên trước
                .requestMatchers("/api/v1/auth/register").hasRole("ADMIN")
                
                // 2. Đặt quy tắc CHUNG (permitAll) xuống sau
                .requestMatchers(
                    "/api/v1/auth/**", // Cho phép /login và các API auth khác
                    "/api/v1/meetings/respond-by-link",
                    "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
                ).permitAll()
                
                // 3. Mọi request còn lại đều phải xác thực
                .anyRequest().authenticated()
            );
        
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, 
                             UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
