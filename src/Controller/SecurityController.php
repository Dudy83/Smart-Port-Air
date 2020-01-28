<?php

namespace App\Controller;

use App\Entity\User;
use ReCaptcha\ReCaptcha;
use App\Form\RegistrationType;
use App\Service\MailerService;
use App\Form\ResetPasswordType;
use App\Repository\UserRepository;
use App\Form\ForgottenPasswordType;
use Symfony\Component\Form\FormError;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\Common\Persistence\ObjectManager;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;

class SecurityController extends AbstractController
{
    /**
     * @Route("/inscription", name="security_registration")
     */
    public function registration(ObjectManager $manager, Request $request, UserPasswordEncoderInterface $encoder, MailerService $mailerService, \Swift_Mailer $mailer)
    {
        $user = new User;

        $form = $this->createForm(RegistrationType::class, $user);
       
        $form->handleRequest($request);

        if($form->isSubmitted() && $form->isValid())
        {
            $regex = '/^[^0-9][_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/';

            if (!preg_match($regex, $user->getEmail())) 
            {
                $this->addFlash('error_email', 'Veuillez entrer un email valide');
    
                return $this->redirectToRoute('security_registration');
            }

            $recaptcha = new \ReCaptcha\ReCaptcha('6Lc4LdMUAAAAAGj3RIgCebGn2JpVmiaHt45Jrzem');
            $resp = $recaptcha->verify($_POST['g-recaptcha-response']);

            if ($resp->isSuccess()) 
            {
                $hash = $encoder->encodePassword($user, $user->getPassword());

                $user->setPassword($hash);
    
                $user->setConfirmationToken($this->generateToken());
    
                $user->setAccountActivated(false);
    
                $manager->persist($user);
    
                $manager->flush();
    
                $email = $user->getEmail();
                $token = $user->getConfirmationToken();
                $username = $user->getUsername();
    
                $message = (new \Swift_Message('Smart Port | Lien de confirmation'))
                    ->setFrom('send@example.com')
                    ->setTo($email)
                    ->setBody(
                        $this->renderView(
                            'email/registration.html.twig',
                            [
                             'username' => $username,
                             'token' => $token
                            ]
                        ),
                        'text/html'
                    );
    
                $mailer->send($message);
    
                $this->addFlash('success', 'Votre compte a bien été enregistré. Un mail de vérification vous a été envoyé à : ' . $email);
    
                return $this->redirectToRoute('security_login');

            } else {
               $errors = $resp->getErrorCodes();

               $this->addFlash('error_captcha', 'Veuillez recommencer la validation par reCaptcha');

            }
                    
        }

        return $this->render('security/registration.html.twig', [
            'form' => $form->createView()
        ]);
    }


    /**
     * @Route("/account/confirm/{token}/{username}", name="confirm_account")
     */
    public function confirmAccount($token, $username)
    {
        $em = $this->getDoctrine()->getManager();
        
        $user = $em->getRepository(User::class)->findOneBy(['username' => $username]);
        
        $tokenExist = $user->getConfirmationToken();
        
        if($token === $tokenExist) 
        {
            $user->setConfirmationToken("NULL");
           
           $user->setAccountActivated(true);
           
           $em->persist($user);
           
           $em->flush();
           
           $this->addFlash('success_email_confirm_token', 'Votre compte a bien été activé. Veuillez vous connecter.');

           return $this->redirectToRoute('security_login');
        } else {
            return $this->render('error/token-expire.html.twig');
        }
    }



    /**
     * @Route("/connexion", name="security_login")
     */
    public function login(AuthenticationUtils $authenticationUtils)
    {
        $error = $authenticationUtils->getLastAuthenticationError();

        return $this->render('security/login.html.twig', [
            'error' => $error
        ]);
    }

    /**
     * @Route("/logout", name="security_logout")
     */
    public function logout(){}

    /**
    * @Route("/edition", name="security_modify")
    */
    public function change_user_password(ObjectManager $manager, Request $request, UserPasswordEncoderInterface $passwordEncoder) 
    {
        
        
        $user = $this->getUser();

        $password = $user->getPassword();

        $form = $this->createForm(ResetPasswordType::class, $user);
       
        $form->handleRequest($request);
       
        if($form->isSubmitted() && $form->isValid())
        {
            $username = $user->getUsername();
            $password = $user->getPassword();

            $this->getDoctrine()->getManager()->refresh($user);

            $old_pwd = $request->get('reset_password')['old_password']; 

            $new_pwd = $request->get('password'); 

            $new_pwd_confirm = $request->get('confirm_confirm');

            $checkPass = $passwordEncoder->isPasswordValid($user, $old_pwd, $user->getSalt());

            if($checkPass === true) 
            {
                $hash = $passwordEncoder->encodePassword($user, $password);

                $user->setPassword($hash);
                $user->setUsername($username);
                
                $manager->persist($user);
                $manager->flush();

                $this->addFlash('modify_success', 'Vos modifications ont bien été changées');

                return $this->redirectToRoute('profil');
            } else {
                $this->addFlash('modify_error', 'Mauvais ancien mot de passe.');
            }
        }

       return $this->render('security/modify.html.twig', [
           'form' => $form->createView()
       ]);
     }



    /**
    * @Route("/delete-user", name="security_delete_user") 
    */
    public function deleteUser(UserRepository $repo, ObjectManager $manager)
    {
        $user = $this->getUser();
        
        $userId = $user->getId();

        $deleteUser = $repo->find($userId);

        $session = $this->get('session');

        $session = new Session();

        $session->invalidate();
        
        $manager->remove($deleteUser);
        
        $manager->flush();

        return $this->redirectToRoute('smart_port');
    }


     /**
    * @Route("/mot-de-passe-oublié", name="security_forgotten_password") 
    */
    public function forgottenPassword(Request $request, ObjectManager $manager, UserRepository $repo, \Swift_Mailer $mailer)
    {
        if($request->isMethod('POST'))
        {
            $email = $request->get('_email'); 

            $userForgotten = $repo->findOneBy(['email' => $email]);

            if($userForgotten === null)
            {
                $this->addFlash('error_forgotten_password', 'Email inconnu.');

                return $this->redirectToRoute('security_forgotten_password');
            } 
            
            $userForgotten->setConfirmationToken($this->generateToken());

            $token = $userForgotten->getConfirmationToken();

            $username = $userForgotten->getUsername();

            $manager->persist($userForgotten);

            $manager->flush();

            $message = (new \Swift_Message('Smart Port | Réinitialisation du votre mot de passe'))
            ->setFrom('send@example.com')
            ->setTo($email)
            ->setBody(
                $this->renderView(
                    'email/forgotten.html.twig',
                    [
                     'token' => $token,
                     'username' => $username
                    ]
                ),
                'text/html'
            );

        $mailer->send($message);

        $this->addFlash('mail_forgotten_password', 'Un email de confirmation vous a été envoyé.');


        }

        return $this->render('security/forgottenpassword.html.twig');
    }

    /**
     * @Route("/reset-password/{token}/{username}", name="confirm_forgotten_password")
     */
    public function confirmForgottenPassword($token, $username, UserRepository $repo, UserPasswordEncoderInterface $passwordEncoder, Request $request, ObjectManager $manager) 
    {
        $user = $repo->findOneBy(['username' => $username]);

        $checkToken = $user->getConfirmationToken();

        $form = $this->createForm(ForgottenPasswordType::class, $user);

        $form->handleRequest($request);

        if($checkToken != $token)
        {
            return $this->render('error/token-expire.html.twig');

        }
                    
        if($form->isSubmitted() && $form->isValid())
        {
            $password = $form['password']->getData();

            $hash = $passwordEncoder->encodePassword($user, $password, $user->getSalt());

            $user->setPassword($hash);

            $user->setConfirmationToken("NULL");

            $manager->persist($user);

            $manager->flush();

            $this->addFlash('success-reset-forgotten-password', 'Votre mot de passe a bien été changé.');
        
            return $this->redirectToRoute('security_login');
        }
        
        return $this->render('security/reset-forgotten-password.html.twig', [
            'form' => $form->createView()
        ]);
    }

    private function generateToken()
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }
}
