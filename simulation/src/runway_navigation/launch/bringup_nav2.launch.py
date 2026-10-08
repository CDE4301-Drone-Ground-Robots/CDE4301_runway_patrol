import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, GroupAction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command, LaunchConfiguration, PythonExpression
from launch.conditions import IfCondition, UnlessCondition
from launch_ros.actions import Node

def generate_launch_description():
    pkg_nav = get_package_share_directory('runway_navigation')
    pkg_desc = get_package_share_directory('runway_description')
    xacro_file = os.path.join(pkg_desc, 'urdf', 'ugv.urdf.xacro')
    robot_description = Command(['xacro ', xacro_file])

    world_name = LaunchConfiguration('world_name')
    use_sim_time = LaunchConfiguration('use_sim_time')
    map_yaml_file = LaunchConfiguration('map')
    params_file = LaunchConfiguration('params_file')
    use_rviz = LaunchConfiguration('use_rviz')
    rviz_config_file = LaunchConfiguration('rviz_config')
    autostart = LaunchConfiguration('autostart')
    use_amcl = LaunchConfiguration('use_amcl')
    use_ekf = LaunchConfiguration('use_ekf')

    default_map_file = PythonExpression([
        "'", pkg_nav, "/maps/nus_ea_field.yaml' if '", world_name, "' == 'nus_ea_field' else '", pkg_nav, "/maps/runway_map.yaml'"
    ])
    default_params_file = os.path.join(pkg_nav, 'config', 'nav2_params.yaml')
    default_rviz_config = os.path.join(pkg_nav, 'rviz', 'runway_nav2.rviz')
    ekf_config_file = PythonExpression([
        "'", pkg_nav, "/config/ekf_nus.yaml' if '", world_name, "' == 'nus_ea_field' else '", pkg_nav, "/config/ekf.yaml'"
    ])

    tf_x = PythonExpression(["'-25.0' if '", world_name, "' == 'nus_ea_field' else '0.0'"])
    tf_y = PythonExpression(["'0.0' if '", world_name, "' == 'nus_ea_field' else '0.0'"])
    tf_yaw = PythonExpression(["'0.0' if '", world_name, "' == 'nus_ea_field' else '-0.2274'"])

    remappings = [('/tf', 'tf'), ('/tf_static', 'tf_static')]

    # 1. Map Server Node
    map_server_node = Node(
        package='nav2_map_server',
        executable='map_server',
        name='map_server',
        output='screen',
        parameters=[
            params_file,
            {'yaml_filename': map_yaml_file, 'use_sim_time': use_sim_time}
        ],
        remappings=remappings
    )

    # 2a. Static Transform Publisher (map -> odom) for outdoor navigation without EKF/AMCL
    static_tf_condition = PythonExpression([
        "'", use_amcl, "' != 'true' and '", use_ekf, "' != 'true'"
    ])
    static_tf_map_odom = Node(
        package='tf2_ros',
        executable='static_transform_publisher',
        name='map_to_odom_publisher',
        arguments=['--x', tf_x, '--y', tf_y, '--z', '0',
                   '--yaw', tf_yaw, '--pitch', '0', '--roll', '0',
                   '--frame-id', 'map',
                   '--child-frame-id', 'odom'],
        parameters=[{'use_sim_time': use_sim_time}],
        condition=IfCondition(static_tf_condition),
        output='screen'
    )

    # 2b. Local EKF Node: Fuses wheel odometry + IMU -> publishes odom -> base_footprint TF
    ekf_local_node = Node(
        package='robot_localization',
        executable='ekf_node',
        name='ekf_filter_node_odom',
        output='screen',
        parameters=[ekf_config_file, {'use_sim_time': use_sim_time}],
        remappings=[('odometry/filtered', 'odometry/local')],
        condition=IfCondition(use_ekf)
    )

    # 2c. NavSat Transform Node: Transforms RTK-GNSS + IMU heading -> Cartesian /odometry/gps
    navsat_transform_node = Node(
        package='robot_localization',
        executable='navsat_transform_node',
        name='navsat_transform',
        output='screen',
        parameters=[ekf_config_file, {'use_sim_time': use_sim_time}],
        remappings=[
            ('imu', 'imu/data'),
            ('gps/fix', 'gps/fix'),
            ('gps/filtered', 'gps/filtered'),
            ('odometry/gps', 'odometry/gps'),
            ('odometry/filtered', 'odometry/global')
        ],
        condition=IfCondition(use_ekf)
    )

    # 2d. Global EKF Node: Fuses local odom + RTK-GNSS Cartesian + IMU -> publishes map -> odom TF
    ekf_global_node = Node(
        package='robot_localization',
        executable='ekf_node',
        name='ekf_filter_node_map',
        output='screen',
        parameters=[ekf_config_file, {'use_sim_time': use_sim_time}],
        remappings=[('odometry/filtered', 'odometry/global')],
        condition=IfCondition(use_ekf)
    )

    # 2b. AMCL Node (Optional when testing indoor/walled particle filter)
    amcl_node = Node(
        package='nav2_amcl',
        executable='amcl',
        name='amcl',
        output='screen',
        parameters=[
            params_file,
            {
                'use_sim_time': use_sim_time,
                'initial_pose.x': PythonExpression(["-25.0 if '", world_name, "' == 'nus_ea_field' else 0.0"]),
                'initial_pose.y': 0.0,
                'initial_pose.z': 0.0,
                'initial_pose.yaw': PythonExpression(["0.0 if '", world_name, "' == 'nus_ea_field' else -0.2274"]),
            }
        ],
        remappings=remappings,
        condition=IfCondition(use_amcl)
    )


    # 3a. Lifecycle Manager for Static Map Localization (Default)
    lifecycle_manager_static = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='lifecycle_manager_localization',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'autostart': autostart},
            {'node_names': ['map_server']},
            {'bond_timeout': 0.0}
        ],
        condition=UnlessCondition(use_amcl)
    )

    # 3b. Lifecycle Manager with AMCL (when use_amcl:=true)
    lifecycle_manager_amcl = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='lifecycle_manager_localization',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'autostart': autostart},
            {'node_names': ['map_server', 'amcl']},
            {'bond_timeout': 0.0}
        ],
        condition=IfCondition(use_amcl)
    )

    # 4. Navigation Stack (Controller, Planner, Behaviors, BT Navigator, Smoother, Collision Monitor)
    navigation_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav, 'launch', 'runway_navigation_launch.py')
        ),
        launch_arguments={
            'use_sim_time': use_sim_time,
            'params_file': params_file,
            'autostart': autostart,
            'use_composition': 'False',
        }.items()
    )

    # 5. RViz2 visualization with Runway Nav2 view
    # Uses LIBGL_ALWAYS_SOFTWARE=1 to bypass WSLg D3D12 GLSL shader link bug on indexed_8bit map textures
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', rviz_config_file],
        parameters=[{
            'use_sim_time': use_sim_time,
            'robot_description': robot_description
        }],
        additional_env={
            'LIBGL_ALWAYS_SOFTWARE': '1',
            'QT_QPA_PLATFORM': 'xcb'
        },
        condition=IfCondition(use_rviz),
        output='screen'
    )

    # 6. UGV C2 Telemetry Bridge Node (also auto-primes /initialpose on startup)
    ugv_c2_bridge_node = Node(
        package='runway_communication',
        executable='ugv_c2_bridge_node',
        name='ugv_c2_bridge_node',
        output='screen',
        parameters=[{
            'use_sim_time': use_sim_time,
            'spawn_x': PythonExpression(["-25.0 if '", world_name, "' == 'nus_ea_field' else 0.0"]),
            'spawn_y': 0.0,
            'spawn_yaw': PythonExpression(["0.0 if '", world_name, "' == 'nus_ea_field' else -0.2274"]),
        }]
    )

    return LaunchDescription([
        DeclareLaunchArgument('world_name', default_value='airport_runway', description='World name: airport_runway or nus_ea_field'),
        DeclareLaunchArgument('use_sim_time', default_value='true', description='Use simulation clock'),
        DeclareLaunchArgument('map', default_value=default_map_file, description='Full path to map yaml file'),
        DeclareLaunchArgument('params_file', default_value=default_params_file, description='Full path to nav2 param file'),
        DeclareLaunchArgument('use_rviz', default_value='true', description='Launch RViz with Nav2 Runway view'),
        DeclareLaunchArgument('rviz_config', default_value=default_rviz_config, description='Full path to RViz config file'),
        DeclareLaunchArgument('autostart', default_value='true', description='Automatically startup the nav2 stack'),
        DeclareLaunchArgument('use_amcl', default_value='false', description='Use AMCL particle filter instead of static map transform'),
        DeclareLaunchArgument('use_ekf', default_value='true', description='Use RTK-GNSS + IMU Dual-EKF localization pipeline'),
        map_server_node,
        static_tf_map_odom,
        ekf_local_node,
        navsat_transform_node,
        ekf_global_node,
        amcl_node,
        lifecycle_manager_static,
        lifecycle_manager_amcl,
        navigation_launch,
        ugv_c2_bridge_node,
        rviz_node,
    ])
